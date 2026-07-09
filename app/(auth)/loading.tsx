import { RouteLoadingTrigger } from "@/components/shared/global-route-loader";

export default function AuthLoading() {
  return <RouteLoadingTrigger label="Loading secure form..." variant="form" />;
}
