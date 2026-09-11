/**
 * Generates high-definition social share preview images (1200x675)
 * for user ground haze reports using HTML5 Canvas API.
 */

export function getAqiTheme(aqi) {
  if (aqi <= 50) {
    return {
      name: 'Good',
      accentColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(16, 185, 129, 0.5)',
      textAccent: '#34d399',
      emoji: '🌿'
    };
  } else if (aqi <= 100) {
    return {
      name: 'Moderate',
      accentColor: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.25)',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.5)',
      textAccent: '#fbbf24',
      emoji: '⛅'
    };
  } else if (aqi <= 200) {
    return {
      name: 'Unhealthy',
      accentColor: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.28)',
      badgeBg: 'rgba(249, 115, 22, 0.18)',
      badgeBorder: 'rgba(249, 115, 22, 0.6)',
      textAccent: '#fb923c',
      emoji: '⚠️'
    };
  } else if (aqi <= 300) {
    return {
      name: 'Very Unhealthy',
      accentColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.32)',
      badgeBg: 'rgba(244, 63, 94, 0.2)',
      badgeBorder: 'rgba(244, 63, 94, 0.7)',
      textAccent: '#fb7185',
      emoji: '🛑'
    };
  } else {
    return {
      name: 'Hazardous',
      accentColor: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.35)',
      badgeBg: 'rgba(168, 85, 247, 0.2)',
      badgeBorder: 'rgba(168, 85, 247, 0.7)',
      textAccent: '#c084fc',
      emoji: '☣️'
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

  // 1. Background base: Deep dark slate gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Atmospheric Haze Glow (Radial Gradient)
  const glow = ctx.createRadialGradient(width * 0.82, height * 0.28, 50, width * 0.8, height * 0.3, 480);
  glow.addColorStop(0, theme.glowColor);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 40, width * 0.2, height * 0.8, 380);
  glow2.addColorStop(0, 'rgba(234, 88, 12, 0.15)');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // 3. Card Frame / Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(32, 32, width - 64, height - 64, 28);
    ctx.stroke();
  }

  // Accent Line at top of frame
  ctx.save();
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(64, 32, width - 128, 4, 2);
  } else {
    ctx.moveTo(64, 32);
    ctx.lineTo(width - 64, 32);
  }
  ctx.stroke();
  ctx.restore();

  // 4. Header Bar
  // Logo & App Name
  ctx.fillStyle = '#f97316';
  ctx.font = '900 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('JEREBU-WATCH', 64, 86);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('•   AIR QUALITY GROUND TRUTH ALERT', 200, 86);

  // Timestamp & Live Pill on Right
  const timeText = report.timestamp || 'Live Report';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(width - 320, 64, 256, 32, 16);
    ctx.fill();
  }
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`🕒 ${timeText}`, width - 304, 85);

  // 5. Main Location Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const areaName = report.areaName || 'Location Not Specified';
  ctx.fillText(areaName, 64, 150);

  // Subtitle / Coordinates & Region
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const latLngStr = report.lat && report.lng ? `(${Number(report.lat).toFixed(4)}° N, ${Number(report.lng).toFixed(4)}° E)` : '';
  ctx.fillText(`📍 ${report.region || report.city || 'Southeast Asia'} ${latLngStr}  •  DBSCAN Spatial Cluster Verified`, 64, 180);

  // 6. Hero AQI Badge Box (Right side of location)
  const aqiBoxX = width - 360;
  const aqiBoxY = 118;
  const aqiBoxW = 296;
  const aqiBoxH = 135;

  ctx.fillStyle = theme.badgeBg;
  ctx.strokeStyle = theme.badgeBorder;
  ctx.lineWidth = 2;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(aqiBoxX, aqiBoxY, aqiBoxW, aqiBoxH, 20);
    ctx.fill();
    ctx.stroke();
  }

  // AQI Number
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${report.estimatedAqi || 150}`, aqiBoxX + 24, aqiBoxY + 70);

  ctx.fillStyle = theme.textAccent;
  ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('AQI', aqiBoxX + 150, aqiBoxY + 45);

  // Intensity Pill
  const intensityLabel = report.intensityLabel || theme.name;
  ctx.fillStyle = theme.accentColor;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(aqiBoxX + 24, aqiBoxY + 88, 248, 32, 10);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${theme.emoji} ${intensityLabel.toUpperCase()}`, aqiBoxX + 38, aqiBoxY + 109);

  // 7. Grid of Sensory Indicators (4 metric cards)
  const metrics = [
    { label: 'VISIBILITY', val: report.visibilityLabel || '< 500m (Very Poor)', icon: '👁️' },
    { label: 'BURNING ODOR', val: report.smellLevel || 'Acrid Peat Smoke', icon: '🔥' },
    { label: 'PANIC INDEX', val: `${report.panicScore || 65}% Elevated`, icon: '⚡' },
    {
      label: 'SYMPTOMS',
      val: (report.symptoms && report.symptoms.length) ? report.symptoms.slice(0, 2).join(', ') : 'Eye Sting, Cough',
      icon: '🩺'
    }
  ];

  const mStartY = 276;
  const mWidth = 250;
  const mHeight = 84;
  const mGap = 23;

  metrics.forEach((m, idx) => {
    const mx = 64 + idx * (mWidth + mGap);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(mx, mStartY, mWidth, mHeight, 14);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${m.icon}  ${m.label}`, mx + 16, mStartY + 26);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    // Truncate if long
    let valText = m.val;
    if (valText.length > 24) valText = valText.substring(0, 22) + '...';
    ctx.fillText(valText, mx + 16, mStartY + 55);
  });

  // 8. Ground Truth Citizen Remark / Quote Box
  const qY = 385;
  const qW = width - 128;
  const qH = 125;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(64, qY, qW, qH, 16);
    ctx.fill();
    ctx.stroke();
  }

  // Left Orange Bar
  ctx.fillStyle = '#ea580c';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(64, qY, 6, qH, 3);
    ctx.fill();
  } else {
    ctx.fillRect(64, qY, 6, qH);
  }

  ctx.fillStyle = '#f97316';
  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('CITIZEN GROUND OBSERVATION', 90, qY + 30);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'italic 500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const desc = report.description || 'Haze is visibly heavy in the neighborhood. Smells strongly of peat smoke.';
  // Wrap text up to 2 lines
  wrapText(ctx, `"${desc}"`, 90, qY + 62, qW - 60, 26, 2);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`— Reported by ${report.reporterName || 'Local Resident'} (${report.reporterRole || 'Resident'})  •  Trust Weight: ${report.trustScore || 1.0}x`, 90, qY + qH - 18);

  // 9. Footer Bar
  const fY = 575;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(64, fY);
  ctx.lineTo(width - 64, fY);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Real-time Crowdsourced Air Quality & Smoke Anomaly Monitoring', 64, fY + 34);

  ctx.fillStyle = '#f97316';
  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('jerebu-watch.my  •  Bridge The Blindspots', width - 330, fY + 34);

  // 10. Produce Outputs
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const safeAreaName = (report.areaName || 'haze-report').toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fileName = `jerebu-watch-${safeAreaName}-aqi${report.estimatedAqi || 100}.png`;
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
