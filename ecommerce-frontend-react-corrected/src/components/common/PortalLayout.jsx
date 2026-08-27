import RoleSidebar from "./RoleSidebar";
export default function PortalLayout({ type, children }) {
  return (
    <div className="container-fluid">
      <div className="row">
        <RoleSidebar type={type} />
        <main className="col-md-9 col-lg-10 portal-content">{children}</main>
      </div>
    </div>
  );
}
