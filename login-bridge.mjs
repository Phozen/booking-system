import http from "node:http";
import fs from "node:fs";

const cookies = JSON.parse(fs.readFileSync("/tmp/cookies.json", "utf8"));

http
  .createServer((req, res) => {
    const setCookies = cookies.map(
      (c) => `${c.name}=${c.value}; Path=/; SameSite=Lax`,
    );
    res.setHeader("Set-Cookie", setCookies);
    res.setHeader("Location", "http://localhost:3000/admin/dashboard");
    res.statusCode = 302;
    res.end("Logging in...");
  })
  .listen(3999, () => console.log("login-bridge on http://localhost:3999"));
