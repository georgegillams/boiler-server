const logsToHtml = (logs) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: monospace;
        background: #1e1e1e;
        color: white;
        line-height: 1.4;
      }
    </style>
  </head>
  <body>
    <div>${logs.split("\n").join("<br/>")}</div>
    <script type="text/javascript">
      window.scrollTo(0, document.body.scrollHeight);
    </script>
  </body>
</html>`;
};

module.exports = { logsToHtml };
