import { Sinwan } from "sinwan-engine";
import { usersRoute } from "./routes/users.route";

const PORT = Bun.env.PORT || Bun.env.HTTP_PORT || 3030;

const app = await Sinwan.create();

app.use((ctx) => {
  console.log(`${ctx.req.method} ${ctx.pathname}`);
});

app.register(usersRoute);

app.get("/", (ctx) => {
  ctx.json({
    message: "hello world from sinwan engine route",
  });
});

await app.listen(PORT, () => {
  console.log(`sinwan engine is running on http://localhost:${PORT}`);
});
