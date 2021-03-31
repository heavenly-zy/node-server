import * as http from "http";
import { IncomingMessage, ServerResponse } from "http";
import * as fs from "fs";
import * as p from "path";
// import * as url from "url";

const server = http.createServer();
const publicDir = p.resolve(__dirname, "public"); // path.resolve() 方法会将路径或路径片段的序列解析为绝对路径
let cacheAge = 3600 * 24 * 365;

server.on("request", (request: IncomingMessage, response: ServerResponse) => {
  const { method, url: path, headers } = request;
  // const { pathname, search } = url.parse(path)
  const { pathname, search } = new URL(`http://${request.headers.host}${path}`);

  if (method !== "GET") {
    response.statusCode = 405;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("不允许处理非 GET 请求");
    return;
  }

  let filename = pathname.slice(1);
  if (filename === "") {
    filename = "index.html";
  }

  fs.readFile(p.resolve(publicDir, filename), (error, data) => {
    if (error) {
      if (error.errno === -4058) {
        response.statusCode = 404;
        fs.readFile(p.resolve(publicDir, "404.html"), (error, data) => {
          response.end(data);
        });
      } else if (error.errno === -4068) {
        response.statusCode = 403;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.end("无权查看目录内容");
      } else {
        response.statusCode = 500;
        response.end("服务器繁忙，请稍后再试");
      }
    } else {
      // 添加缓存
      response.setHeader("Cache-Control", `public, max-age=${cacheAge}`);
      // 返回文件内容
      response.end(data);
    }
  });
});

server.listen(8888);
