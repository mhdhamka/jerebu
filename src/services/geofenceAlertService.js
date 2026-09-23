/**
 * Geofenced Alerting & External Webhook Dispatch Engine
 * Supports browser notifications, Telegram Bot webhooks, WhatsApp message payloads,
 * and OASIS Common Alerting Protocol (CAP v1.2) XML serialization.
 * Enforces strictly text-only formatting with zero emojis.
 */

import { calculateDistanceKm } from '../data/sarawakLocations.js';

const STORAGE_KEY = 'jerebu_geofence_alerts';

export class GeofenceAlertService {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load geofence alert config:', e);
    }
    return {
      enabled: false,
      pinnedLocation: {
        name: 'Kuching City Center',
        lat: 1.5533,
        lng: 110.3592
      },
      geofenceRadiusKm: 25,
      thresholdAqi: 150,
      enableDivergenceAlerts: true,
      enableSchoolClosureAlerts: true,
      telegramWebhookUrl: '',
      telegramChatId: '',
      customWebhookUrl: '',
      lastDispatchedAt: null,
      recentAlerts: []
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save geofence alert config:', e);
    }
    return this.config;
  }

  getConfig() {
    return { ...this.config };
  }

  /**
   * Evaluates conditions against pinned geofence.
   * @param {Array} stations Official stations
   * @param {Array} reports Community reports
   * @param {Array} divergences Divergence anomalies
   * @returns {Array} Triggered alert objects
   */
  evaluateGeofence(stations = [], reports = [], divergences = []) {
    const alerts = [];
    if (!this.config.enabled) return alerts;

    const { lat: userLat, lng: userLng, name: locName } = this.config.pinnedLocation;
    const radius = this.config.geofenceRadiusKm || 25;
    const threshold = this.config.thresholdAqi || 150;

    // 1. Evaluate nearby official stations
    for (const st of stations) {
      if (typeof st.lat !== 'number' || typeof st.lng !== 'number') continue;
      const d = calculateDistanceKm(userLat, userLng, st.lat, st.lng);
      if (d <= radius) {
        if (st.aqi >= 200 && this.config.enableSchoolClosureAlerts) {
          alerts.push({
            id: `alert_moe_${st.id}_${Date.now()}`,
            type: 'MOE_SCHOOL_CLOSURE',
            urgency: 'Immediate',
            severity: 'Severe',
            title: `[MOE CLOSURE ALERT] ${st.name} crossed 200 AQI`,
            body: `Station reading: ${st.aqi} AQI. Ministry of Education SOP: Immediate suspension of school sessions and outdoor activities within ${locName} perimeter.`,
            stationName: st.name,
            aqi: st.aqi,
            distanceKm: Math.round(d),
            timestamp: new Date().toISOString()
          });
        } else if (st.aqi >= threshold) {
          alerts.push({
            id: `alert_thresh_${st.id}_${Date.now()}`,
            type: 'THRESHOLD_BREACH',
            urgency: 'Expected',
            severity: 'Moderate',
            title: `[HAZE ALERT] ${st.name} reading ${st.aqi} AQI`,
            body: `Air quality crossed threshold of ${threshold} AQI within ${Math.round(d)}km of ${locName}. N95 particulate respirators recommended for sensitive groups.`,
            stationName: st.name,
            aqi: st.aqi,
            distanceKm: Math.round(d),
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // 2. Evaluate nearby reality-check divergences
    if (this.config.enableDivergenceAlerts) {
      for (const div of divergences) {
        if (!div.lat || !div.lng) continue;
        const d = calculateDistanceKm(userLat, userLng, div.lat, div.lng);
        if (d <= radius && (div.deltaAqi >= 30 || div.isDivergent)) {
          alerts.push({
            id: `alert_div_${div.stationId || 'div'}_${Date.now()}`,
            type: 'DIVERGENCE_SPIKE',
            urgency: 'Expected',
            severity: 'Moderate',
            title: `[DIVERGENCE SPIKE] Reality check gap near ${div.stationName}`,
            body: `Citizen ground reports indicate ${div.citizenAqi} AQI (+${div.deltaAqi} above official sensor). Local smoke trapping detected within ${Math.round(d)}km.`,
            stationName: div.stationName,
            aqi: div.citizenAqi,
            distanceKm: Math.round(d),
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Generates a Telegram Bot message payload formatted in clean Markdown without emojis.
   */
  formatTelegramPayload(alert) {
    const text = [
      `*ALERT: JEREBU AQI MONITOR*`,
      `Type: ${alert.type}`,
      `Location: ${alert.stationName} (${alert.distanceKm} km from pinned zone)`,
      `Air Quality: ${alert.aqi} AQI`,
      `Severity: ${alert.severity.toUpperCase()}`,
      `Details: ${alert.body}`,
      `Timestamp: ${new Date(alert.timestamp).toUTCString()}`,
      `Source: JerebuAQI Ground Truth & APIMS Feed`
    ].join('\n');

    return {
      chat_id: this.config.telegramChatId || '@jerebualerts',
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };
  }

  /**
   * Dispatches a webhook payload to Telegram or a custom endpoint.
   */
  async dispatchWebhook(alert, targetUrl = null) {
    const url = targetUrl || this.config.telegramWebhookUrl || this.config.customWebhookUrl;
    if (!url) {
      return { success: false, reason: 'No webhook endpoint configured' };
    }

    const isTelegram = url.includes('api.telegram.org');
    const payload = isTelegram ? this.formatTelegramPayload(alert) : {
      event: 'haze_alert',
      data: alert,
      generated_at: new Date().toISOString(),
      platform: 'JerebuAQI'
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return {
        success: res.ok,
        status: res.status,
        payload
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        payload
      };
    }
  }

  /**
   * Generates OASIS Common Alerting Protocol (CAP v1.2) XML string for civil defense feeds.
   */
  generateCapXml(alert) {
    const alertId = alert.id || `JEREBU-${Date.now()}`;
    const sent = new Date(alert.timestamp || Date.now()).toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${alertId}</identifier>
  <sender>jerebu-aqi-system@alert.local</sender>
  <sent>${sent}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Env</category>
    <event>Transboundary Haze & Particulate Exposure</event>
    <urgency>${alert.urgency || 'Immediate'}</urgency>
    <severity>${alert.severity || 'Severe'}</severity>
    <certainty>Observed</certainty>
    <eventCode>
      <valueName>AQI_INDEX</valueName>
      <value>${alert.aqi}</value>
    </eventCode>
    <headline>${alert.title}</headline>
    <description>${alert.body}</description>
    <area>
      <areaDesc>${alert.stationName}</areaDesc>
    </area>
  </info>
</alert>`;
  }
}

export const geofenceAlertService = new GeofenceAlertService();
