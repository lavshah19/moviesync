import { Router } from "express";
const router = Router();
import authRoute from "../modules/auth/routes/auth.route.js";
import movieRoute from "../modules/movie/routes/movie.route.js";

interface Route {
  path: string;
  route: Router;
}

const routes: Route[] = [
  { path: "/auth", route: authRoute },
  { path: "/movies", route: movieRoute },
];
routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
