import { CheckboxGroup, FormControl, Checkbox } from '@primer/react';

export type CheckboxValue = 'true' | 'false';

type LayerToggleProps = {
  layers: {
    added: CheckboxValue;
    removed: CheckboxValue;
    layoutChanged: CheckboxValue;
    attributesChanged: CheckboxValue;
  };
  onChange: (layers: {
    added: CheckboxValue;
    removed: CheckboxValue;
    layoutChanged: CheckboxValue;
    attributesChanged: CheckboxValue;
  }) => void;
};

export function LayerToggle({ layers, onChange }: LayerToggleProps) {
  return (
    <CheckboxGroup>
      <CheckboxGroup.Label>Layers</CheckboxGroup.Label>
      <FormControl>
        <Checkbox
          defaultChecked
          value={layers.added}
          onChange={e => onChange({ ...layers, added: e.target.checked ? 'true' : 'false' })}
        />
        <FormControl.Label>Added</FormControl.Label>
      </FormControl>
      <FormControl sx={{ marginTop: '10px' }}>
        <Checkbox
          defaultChecked
          value={layers.removed}
          onChange={e => onChange({ ...layers, removed: e.target.checked ? 'true' : 'false' })}
        />
        <FormControl.Label>Removed</FormControl.Label>
      </FormControl>
      <FormControl sx={{ marginTop: '10px' }}>
        <Checkbox
          value={layers.layoutChanged}
          onChange={e => onChange({ ...layers, layoutChanged: e.target.checked ? 'true' : 'false' })}
        />
        <FormControl.Label>Layout changed</FormControl.Label>
      </FormControl>
      <FormControl sx={{ marginTop: '10px' }}>
        <Checkbox
          defaultChecked
          value={layers.attributesChanged}
          onChange={e => onChange({ ...layers, attributesChanged: e.target.checked ? 'true' : 'false' })}
        />
        <FormControl.Label>Attributes changed</FormControl.Label>
      </FormControl>
    </CheckboxGroup>
  );
}
