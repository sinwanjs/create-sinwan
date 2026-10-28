import { createHttpModule } from "sinwan-engine";

export const usersRoute = createHttpModule({
  prefix: "/users",
  routes(router) {
    router.get("/", (ctx) => {
      ctx.json({ message: "Hello World" });
    });
  },
});
