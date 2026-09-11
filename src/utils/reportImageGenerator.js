/**
 * Generates high-definition social share preview images (1200x675)
 * for user ground haze reports using HTML5 Canvas API.
 */

export function getAqiTheme(aqi) {
  if (aqi <= 50) {
    return {
      name: 'Good',
      accentColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.22)',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      badgeBorder: 'rgba(16, 185, 129, 0.4)',
      textAccent: '#34d399'
    };
  } else if (aqi <= 100) {
    return {
      name: 'Moderate',
      accentColor: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.22)',
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      badgeBorder: 'rgba(245, 158, 11, 0.4)',
      textAccent: '#fbbf24'
    };
  } else if (aqi <= 200) {
    return {
      name: 'Unhealthy',
      accentColor: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.25)',
      badgeBg: 'rgba(249, 115, 22, 0.15)',
      badgeBorder: 'rgba(249, 115, 22, 0.5)',
      textAccent: '#fb923c'
    };
  } else if (aqi <= 300) {
    return {
      name: 'Very Unhealthy',
      accentColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.28)',
      badgeBg: 'rgba(244, 63, 94, 0.16)',
      badgeBorder: 'rgba(244, 63, 94, 0.6)',
      textAccent: '#fb7185'
    };
  } else {
    return {
      name: 'Hazardous',
      accentColor: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.3)',
      badgeBg: 'rgba(168, 85, 247, 0.16)',
      badgeBorder: 'rgba(168, 85, 247, 0.6)',
      textAccent: '#c084fc'
    };
  }
}

/**
 * Renders an air quality status card into a PNG image dataURL and Blob
 * @param {Object} report The ground truth report
 * @returns {Promise<{ dataUrl: string, blob: Blob, file: File, fileName: string }>}
 */
export async function generateReportImage(report) {
  const width = 1200;
  const height = 675;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const theme = getAqiTheme(report.estimatedAqi || 150);

  // 1. Background base: Deep immersive dark slate gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#060911');
  bgGrad.addColorStop(0.5, '#0b1120');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Atmospheric Ambient Glows
  const glow = ctx.createRadialGradient(width * 0.85, height * 0.22, 40, width * 0.8, height * 0.25, 520);
  glow.addColorStop(0, theme.glowColor);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(width * 0.12, height * 0.88, 30, width * 0.15, height * 0.85, 420);
  glow2.addColorStop(0, 'rgba(249, 115, 22, 0.12)');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // 3. Outer Container Card Frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(28, 28, width - 56, height - 56, 24);
    ctx.stroke();
  }

  // Top Dynamic Theme Accent Border
  ctx.save();
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(56, 28, width - 112, 3, 1.5);
  } else {
    ctx.moveTo(56, 28);
    ctx.lineTo(width - 56, 28);
  }
  ctx.stroke();
  ctx.restore();

  // 4. Header Bar
  ctx.fillStyle = '#f97316';
  ctx.font = '800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('JEREBU', 56, 78);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('/   GROUND TRUTH INTELLIGENCE', 114, 78);

  // Live Timestamp Pill
  const timeText = report.timestamp || 'Live Report';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(width - 264, 58, 208, 28, 14);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(timeText, width - 246, 76);

  // 5. Main Location Title & Metadata
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const areaName = report.areaName || 'Location Not Specified';
  ctx.fillText(areaName, 56, 138);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const latLngStr = report.lat && report.lng ? `(${Number(report.lat).toFixed(4)}° N, ${Number(report.lng).toFixed(4)}° E)` : '';
  ctx.fillText(`${report.region || report.city || 'Southeast Asia'}   ${latLngStr}   •   DBSCAN Cluster Verified`, 56, 166);

  // 6. Hero AQI Indicator Module (Right Side)
  const aqiBoxX = width - 344;
  const aqiBoxY = 108;
  const aqiBoxW = 288;
  const aqiBoxH = 126;

  ctx.fillStyle = theme.badgeBg;
  ctx.strokeStyle = theme.badgeBorder;
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(aqiBoxX, aqiBoxY, aqiBoxW, aqiBoxH, 16);
    ctx.fill();
    ctx.stroke();
  }

  // AQI Large Value
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${report.estimatedAqi || 150}`, aqiBoxX + 22, aqiBoxY + 66);

  ctx.fillStyle = theme.textAccent;
  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('AQI SCORE', aqiBoxX + 144, aqiBoxY + 42);

  // Sub-badge for Status
  const intensityLabel = report.intensityLabel || theme.name;
  ctx.fillStyle = theme.accentColor;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(aqiBoxX + 22, aqiBoxY + 80, 244, 28, 6);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(intensityLabel.toUpperCase(), aqiBoxX + 36, aqiBoxY + 98);

  // 7. Grid of Sensory Indicators (4 Modern Metric Cards)
  const metrics = [
    { label: 'VISIBILITY RANGE', val: report.visibilityLabel || '< 500m (Very Poor)' },
    { label: 'SURFACE ODOR', val: report.smellLevel || 'Acrid Peat Smoke' },
    { label: 'ANOMALY INDEX', val: `${report.panicScore || 65}% Elevated` },
    {
      label: 'NOTED SYMPTOMS',
      val: (report.symptoms && report.symptoms.length) ? report.symptoms.slice(0, 2).join(', ') : 'Eye Sting, Cough'
    }
  ];

  const mStartY = 262;
  const mWidth = 260;
  const mHeight = 80;
  const mGap = 16;

  metrics.forEach((m, idx) => {
    const mx = 56 + idx * (mWidth + mGap);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(mx, mStartY, mWidth, mHeight, 12);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.label, mx + 16, mStartY + 26);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    let valText = m.val;
    if (valText.length > 28) valText = valText.substring(0, 26) + '...';
    ctx.fillText(valText, mx + 16, mStartY + 52);
  });

  // 8. Citizen Observation Block
  const qY = 368;
  const qW = width - 112;
  const qH = 118;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(56, qY, qW, qH, 14);
    ctx.fill();
    ctx.stroke();
  }

  // Left Active Pillar
  ctx.fillStyle = '#ea580c';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(56, qY, 4, qH, 2);
    ctx.fill();
  } else {
    ctx.fillRect(56, qY, 4, qH);
  }

  ctx.fillStyle = '#f97316';
  ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('CITIZEN GROUND OBSERVATION', 80, qY + 26);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'italic 500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const desc = report.description || 'Haze is visibly heavy in the neighborhood. Smells strongly of peat smoke.';
  wrapText(ctx, `"${desc}"`, 80, qY + 54, qW - 50, 22, 2);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Reported by ${report.reporterName || 'Local Resident'} (${report.reporterRole || 'Resident'})   •   Trust Weight: ${report.trustScore || 1.0}x`, 80, qY + qH - 16);

  // 9. Modernized Footer Bar
  const fY = 560;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, fY);
  ctx.lineTo(width - 56, fY);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Real-time Crowdsourced Air Quality & Smoke Anomaly Monitoring', 56, fY + 32);

  ctx.fillStyle = '#f97316';
  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('jerebu.my   •   Bridge The Blindspots', width - 290, fY + 32);

  // 10. Output Generation
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const safeAreaName = (report.areaName || 'haze-report').toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fileName = `jerebu-${safeAreaName}-aqi${report.estimatedAqi || 100}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  return {
    dataUrl,
    blob,
    file,
    fileName
  };
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line + '...', x, y);
        return;
      }
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}