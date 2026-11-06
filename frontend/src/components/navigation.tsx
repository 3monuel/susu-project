import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
  type LinkProps,
} from "react-router-dom";

export { useLocation, useNavigate, useSearchParams };

export function useProjectParams() {
  const params = useParams<{ projectSlug?: string }>();
  const [search] = useSearchParams();
  return {
    projectSlug: params.projectSlug ?? search.get("proyecto") ?? undefined,
  };
}

export function Link({ href, ...props }: Omit<LinkProps, "to"> & { href: string }) {
  return <RouterLink to={href} {...props} />;
}

export default Link;
