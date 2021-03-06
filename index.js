const Dicer = require("dicer");
const http = require("http");
const { inspect } = require("util");

const RE_BOUNDARY =
  /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;
const HTML = Buffer.from(`
<html>
  <head></head>
  <body>
    <form method="POST" enctype="multipart/form-data">
      <input type="text" name="textfield"/><br />
      <input type="file" name="filefield"/><br />
      <input type="submit"/>
    </form>
  </body>
</html>
`);
const PORT = 8080;

http
  .createServer((req, res) => {
    let m;

    if (
      req.method === "POST" &&
      req.headers["content-type"] &&
      (m = RE_BOUNDARY.exec(req.headers["content-type"]))
    ) {
      const d = new Dicer({ boundary: m[1] || m[2] });

      d.on("part", (p) => {
        console.log("New part!");

        p.on("header", (header) => {
          for (const h in header) {
            console.log(
              `Part header: k: ${inspect(h)}, v: ${inspect(header[h])}`
            );
          }
        });

        p.on("data", (data) => {
          console.log(`Part data: ${inspect(data.toString())}`);
        });

        p.on("end", () => {
          console.log("End of part\n");
        });
      });

      d.on("finish", () => {
        console.log("End of parts");

        res.writeHead(200);
        res.end("Form submission successful!");
      });

      req.pipe(d);
    } else if (req.method === "GET" && req.url === "/") {
      res.writeHead(200);
      res.end(HTML);
    } else {
      res.writeHead(404);
      res.end();
    }
  })
  .listen(PORT, () => {
    console.log(`Listening for requests on port ${PORT}`);
  });
