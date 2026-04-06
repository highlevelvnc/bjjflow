import { NextResponse } from "next/server"

export function GET() {
  const js = `(function() {
  var script = document.currentScript;
  var academy = script.getAttribute('data-academy');
  var theme = script.getAttribute('data-theme') || 'dark';
  if (!academy) {
    console.warn('[GrapplingFlow] Missing data-academy attribute on script tag.');
    return;
  }
  var container = document.createElement('div');
  container.innerHTML = '<iframe src="https://grapplingflow.com/embed?academy=' + encodeURIComponent(academy) + '&theme=' + encodeURIComponent(theme) + '" width="100%" height="600" frameborder="0" style="border-radius:12px;border:1px solid ' + (theme === 'light' ? '#e5e7eb' : '#333') + ';" title="Class Schedule" loading="lazy"></iframe>';
  script.parentNode.insertBefore(container, script);
})();`

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
