import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-5 text-center">
      <span className="text-6xl">404</span>
      <p className="text-sm text-muted-foreground">This page could not be found.</p>
      <Link to="/" className="btn-solid">
        Back to StyleNest Fashion
      </Link>
    </div>
  );
}
