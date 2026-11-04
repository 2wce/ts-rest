export const InstallTabs = ({ packageName }: { packageName: string }) => {
  return (
    <p>
      Development-checkout package: <code>{packageName}</code>. Public{' '}
      <code>@ts-restless/*</code> packages are being prepared. See the{' '}
      <a href="/ts-restless-migration">prerelease and migration guide</a> for
      installation after publication.
    </p>
  );
};
