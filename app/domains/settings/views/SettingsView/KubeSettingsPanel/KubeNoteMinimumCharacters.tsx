import { useField } from 'formik';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { FormControl } from '@/ui/components/forms/FormControl';
import { SwitchField } from '@/ui/components/forms/SwitchField';
import { Input } from '@/ui/components/forms/Input';

import { useToggledValue } from '../useToggledValue';

export function KubeNoteMinimumCharacters() {
  const [{ value }, { error }, { setValue }] = useField<number>(
    'globalDeploymentOptions.minApplicationNoteLength'
  );
  const [isEnabled, setIsEnabled] = useToggledValue(
    'globalDeploymentOptions.minApplicationNoteLength',
    'globalDeploymentOptions.requireNoteOnApplications'
  );

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Require a note on applications"
            data-cy="kube-settings-require-note-on-applications-switch"
            checked={isEnabled}
            name="toggle_requireNoteOnApplications"
            onChange={(value) => setIsEnabled(value)}
            featureId={FeatureId.K8S_REQUIRE_NOTE_ON_APPLICATIONS}
            labelClass="col-sm-3 col-lg-2"
            tooltip={`${
              isBE ? '' : 'BE allows entry of notes in Add/Edit application. '
            }Using this will enforce entry of a note in Add/Edit application (and prevent complete clearing of it in Application details).`}
          />
        </div>
      </div>
      {isEnabled && (
        <FormControl
          label={
            <span className="pl-4">
              Minimum number of characters note must have
            </span>
          }
          errors={error}
        >
          <Input
            name="minNoteLength"
            data-cy="min-note-length-input"
            type="number"
            placeholder="50"
            min="1"
            max="9999"
            value={value}
            onChange={(e) => setValue(e.target.valueAsNumber)}
            className="w-1/4"
          />
        </FormControl>
      )}
    </>
  );
}
