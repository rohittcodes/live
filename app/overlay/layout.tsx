export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: transparent !important; overflow: hidden; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
