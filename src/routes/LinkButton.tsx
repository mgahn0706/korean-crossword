import type { ReactNode } from "react";
import type { RoutePath } from "./config";

function navigateTo(path: RoutePath) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function LinkButton({
  path,
  children,
  className,
}: {
  path: RoutePath;
  children: ReactNode;
  className: string;
}) {
  return (
    <a
      href={path}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        navigateTo(path);
      }}
    >
      {children}
    </a>
  );
}
