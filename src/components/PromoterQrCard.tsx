"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const BRAND = {
  black: "#000000",
  magenta: "#e91e8c",
  white: "#f5f5f7",
  muted: "#a898b0",
};

const LOGO_SRC = "/galaxy-logo.png";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function PromoterQrCard({
  code,
  salesUrl,
  commissionPercent,
}: {
  code: string;
  salesUrl: string;
  commissionPercent: number;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const qr = await QRCode.toDataURL(salesUrl, {
        width: 420,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
      if (cancelled) return;
      setDataUrl(qr);

      const flyer = await composeFlyerPng(qr, code);
      if (!cancelled) setFlyerUrl(flyer);
    })();
    return () => {
      cancelled = true;
    };
  }, [salesUrl, code]);

  function shareOnFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(salesUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=480");
  }

  function printQr() {
    if (!dataUrl) return;
    // Bez "noopener" — inaczej window.open zwraca null i nie da się zapisać dokumentu.
    const w = window.open("", "_blank", "width=520,height=820");
    if (!w) return;
    const origin = window.location.origin;
    const safeCode = escapeHtml(code);
    w.document.write(`<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>Galaxy QR · ${safeCode}</title>
  <style>
    @page { margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, Helvetica, sans-serif;
      background: ${BRAND.black};
      color: ${BRAND.white};
    }
    .card {
      width: 100%;
      max-width: 420px;
      padding: 40px 28px 44px;
      text-align: center;
      background: ${BRAND.black};
    }
    .logo {
      display: block;
      margin: 0 auto;
      height: 160px;
      width: auto;
    }
    .qr-wrap {
      margin: 28px auto 20px;
      padding: 14px;
      width: fit-content;
      background: #fff;
    }
    .qr-wrap img { display: block; width: 260px; height: 260px; }
    .tagline {
      margin: 8px 0 0;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: ${BRAND.white};
    }
    .code {
      margin-top: 18px;
      font-size: 22px;
      letter-spacing: 0.18em;
      font-weight: 700;
      color: ${BRAND.magenta};
    }
    .note {
      margin-top: 16px;
      font-size: 12px;
      line-height: 1.5;
      color: ${BRAND.muted};
    }
  </style>
</head>
<body>
  <div class="card">
    <img class="logo" src="${origin}${LOGO_SRC}" alt="Galaxy Music Club Gdańsk" />
    <div class="qr-wrap">
      <img src="${escapeHtml(dataUrl)}" alt="QR ${safeCode}" />
    </div>
    <p class="tagline">Baw się z nami w Galaxy</p>
    <div class="code">${safeCode}</div>
    <p class="note">Zeskanuj QR i kup bilet — z tym kodem dostaniesz specjalną zniżkę.</p>
  </div>
  <script>window.onload = function () { window.print(); }</script>
</body>
</html>`);
    w.document.close();
  }

  return (
    <div className="border border-white/10 p-6">
      <p className="text-xs tracking-wider text-galaxy-muted uppercase">
        QR sprzedaży
      </p>
      <p className="mt-2 text-sm text-galaxy-muted">
        Skan prowadzi do sprzedaży biletów z Twoim ID. Po udanej transakcji
        dostajesz <span className="text-galaxy-pink">{commissionPercent}%</span> na
        portfel promotora.
      </p>

      <div
        ref={printRef}
        className="mt-6 overflow-hidden border border-white/15 bg-black"
      >
        <div className="flex flex-col items-center px-6 py-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="Galaxy Music Club Gdańsk"
            className="h-40 w-auto"
          />

          <div className="mt-6 bg-white p-3">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt={`QR ${code}`} className="h-52 w-52" />
            ) : (
              <div className="flex h-52 w-52 items-center justify-center text-sm text-neutral-500">
                Generowanie QR…
              </div>
            )}
          </div>

          <p className="mt-5 text-lg font-semibold tracking-wide text-white">
            Baw się z nami w Galaxy
          </p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-lg tracking-[0.2em] text-galaxy-magenta">
            {code}
          </p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-galaxy-muted">
            Zeskanuj QR i kup bilet — z tym kodem dostaniesz specjalną zniżkę.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={printQr}
          disabled={!dataUrl}
          className="galaxy-glow bg-white px-5 py-2.5 text-sm font-semibold tracking-wider text-black disabled:opacity-50"
        >
          Drukuj QR
        </button>
        {flyerUrl ? (
          <a
            href={flyerUrl}
            download={`galaxy-qr-${code}.png`}
            className="border border-white/20 px-5 py-2.5 text-sm tracking-wider transition hover:border-galaxy-magenta hover:text-galaxy-pink"
          >
            Pobierz PNG
          </a>
        ) : null}
        <button
          type="button"
          onClick={shareOnFacebook}
          className="inline-flex items-center gap-2 bg-[#1877F2] px-5 py-2.5 text-sm font-semibold tracking-wider text-white transition hover:bg-[#166fe5]"
          aria-label="Udostępnij na Facebooku"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0 fill-current"
            aria-hidden
          >
            <path d="M14 8.5h2.5V5.2c-.4-.1-1.6-.2-2.9-.2-2.9 0-4.9 1.8-4.9 5V13H6v3.7h2.7V24h3.6v-7.3H15l.5-3.7h-3.2V10.5c0-1.1.3-1.9 1.7-1.9z" />
          </svg>
          Facebook
        </button>
      </div>
    </div>
  );
}

async function composeFlyerPng(qrDataUrl: string, code: string): Promise<string> {
  const width = 720;
  const height = 960;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrDataUrl;

  ctx.fillStyle = BRAND.black;
  ctx.fillRect(0, 0, width, height);

  try {
    const logo = await loadImage(LOGO_SRC);
    const logoH = 220;
    const logoW = (logo.width / Math.max(logo.height, 1)) * logoH;
    ctx.drawImage(logo, (width - logoW) / 2, 36, logoW, logoH);
  } catch {
    ctx.fillStyle = BRAND.white;
    ctx.font = "700 42px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GALAXY", width / 2, 140);
  }

  ctx.textAlign = "center";

  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 340;
  const qrX = (width - qrSize) / 2;
  const qrY = 280;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = BRAND.white;
  ctx.font = "600 28px Arial, sans-serif";
  ctx.fillText("Baw się z nami w Galaxy", width / 2, qrY + qrSize + 70);

  ctx.fillStyle = BRAND.magenta;
  ctx.font = "700 30px Arial, sans-serif";
  ctx.fillText(code, width / 2, qrY + qrSize + 118);

  ctx.fillStyle = BRAND.muted;
  ctx.font = "400 16px Arial, sans-serif";
  wrapCenter(
    ctx,
    "Zeskanuj QR i kup bilet — z tym kodem dostaniesz specjalną zniżkę.",
    width / 2,
    qrY + qrSize + 158,
    width - 100,
    22,
  );

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapCenter(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
