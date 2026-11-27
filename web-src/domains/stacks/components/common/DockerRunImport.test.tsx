import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YAML from 'yaml';

import { DockerRunImport } from './DockerRunImport';
import { dockerRunToCompose } from './dockerRunToCompose';

describe('dockerRunToCompose', () => {
  it('preserves Docker options and literal argument boundaries in valid YAML', () => {
    const yaml = dockerRunToCompose(
      "docker run -dit --name demo -p 127.0.0.1:8080:80 -e 'MESSAGE=hello $USER' -e DEBUG=no -v cache:/data:ro --restart=on-failure:3 \\\n" +
        "--workdir /app --entrypoint /bin/sh alpine:3.23 -c 'echo \"$MESSAGE\"' ''"
    );

    expect(YAML.parse(yaml)).toEqual({
      services: {
        app: {
          image: 'alpine:3.23',
          container_name: 'demo',
          ports: ['127.0.0.1:8080:80'],
          environment: ['MESSAGE=hello $$USER', 'DEBUG=no'],
          volumes: ['cache:/data:ro'],
          restart: 'on-failure:3',
          working_dir: '/app',
          entrypoint: ['/bin/sh'],
          stdin_open: true,
          tty: true,
          command: ['-c', 'echo "$$MESSAGE"', ''],
        },
      },
      volumes: { cache: { name: 'cache' } },
    });
  });

  it('clears an image entrypoint and supports an escaped trailing space', () => {
    expect(
      YAML.parse(
        dockerRunToCompose('docker run --entrypoint="" alpine echo word\\ ')
      )
    ).toEqual({
      services: {
        app: { image: 'alpine', entrypoint: [], command: ['echo', 'word '] },
      },
    });
  });

  it.each([
    ['docker run --rm nginx', /Unsupported Docker run option --rm/],
    [
      'docker run --env-env=secret nginx',
      /Unsupported Docker run option --env-env/,
    ],
    ['docker run -e TOKEN nginx', /NAME=value/],
    ['docker run nginx echo $TOKEN', /literal arguments/],
    ['docker run nginx && echo other', /single command/],
    ['docker run nginx\necho other', /single command/],
    ["docker run nginx echo 'open", /unbalanced quote/],
    ['docker run --name', /requires a value/],
  ])('rejects a command it cannot faithfully convert: %s', (input, error) => {
    expect(() => dockerRunToCompose(input)).toThrow(error);
  });
});

describe('DockerRunImport', () => {
  it('previews conversion before insertion and preserves an existing draft', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    const view = render(<DockerRunImport isEmpty onInsert={onInsert} />);
    await user.click(screen.getByText('Convert Docker run to Compose'));
    await user.type(
      screen.getByLabelText('Docker run command'),
      'docker run nginx'
    );
    await user.click(screen.getByRole('button', { name: 'Preview Compose' }));
    const preview = screen.getByLabelText<HTMLTextAreaElement>(
      'Generated Compose YAML'
    );

    expect(preview.value).toContain('image: nginx');
    expect(onInsert).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Insert YAML' }));
    expect(onInsert).toHaveBeenCalledWith(preview.value);

    view.rerender(<DockerRunImport isEmpty={false} onInsert={onInsert} />);
    expect(
      screen.queryByRole('button', { name: 'Insert YAML' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy YAML' })).toBeEnabled();
  });

  it('clears the preview when new input fails conversion', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(<DockerRunImport isEmpty onInsert={onInsert} />);
    await user.click(screen.getByText('Convert Docker run to Compose'));
    const input = screen.getByLabelText('Docker run command');
    const preview = screen.getByRole('button', { name: 'Preview Compose' });
    await user.type(input, 'docker run nginx');
    await user.click(preview);
    expect(screen.getByLabelText('Generated Compose YAML')).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'docker run --rm nginx');
    await user.click(preview);
    expect(
      screen.queryByLabelText('Generated Compose YAML')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Unsupported Docker run option --rm/)
    ).toBeInTheDocument();
    expect(onInsert).not.toHaveBeenCalled();
  });
});
