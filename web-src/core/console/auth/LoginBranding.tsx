export function LoginLogo({ logo }: { logo?: string }) {
  if (logo) {
    return <img src={logo} className="simple-box-logo" alt="Vessel HQ" />;
  }

  return (
    <>
      <img
        src="/images/vessel-hq-logo.svg"
        className="simple-box-logo hidden th-highcontrast:!block th-dark:!block"
        alt="Vessel HQ"
      />
      <img
        src="/images/vessel-hq-logo-dark.svg"
        className="simple-box-logo block th-highcontrast:hidden th-dark:hidden"
        alt="Vessel HQ"
      />
    </>
  );
}

export function LoginHeading() {
  return (
    <div className="row p-5 text-center">
      <p className="text-xl">Log in to your account</p>
      <p className="text-md text-muted font-bold">
        Welcome back! Please enter your details
      </p>
    </div>
  );
}
