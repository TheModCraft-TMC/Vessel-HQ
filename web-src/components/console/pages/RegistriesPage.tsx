'use client';

import { RegistriesDatatable } from '@/domains/registries/views/ListView/RegistriesDatatable';

import { InformationPanel } from '@@/InformationPanel';

export function RegistriesContent() {
  return (
    <>
      <div className="row">
        <div className="col-sm-12">
          <InformationPanel title="Information">
            <span className="small text-muted">
              View registries via an environment to manage access for user(s)
              and/or team(s)
            </span>
          </InformationPanel>
        </div>
      </div>
      <RegistriesDatatable />
    </>
  );
}
