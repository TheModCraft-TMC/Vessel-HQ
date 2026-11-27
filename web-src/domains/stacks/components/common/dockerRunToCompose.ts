import YAML from 'yaml';

type Option =
  | 'name'
  | 'env'
  | 'publish'
  | 'volume'
  | 'restart'
  | 'user'
  | 'workdir'
  | 'entrypoint';

type ComposeService = {
  image: string;
  container_name?: string;
  environment?: string[];
  ports?: string[];
  volumes?: string[];
  restart?: string;
  user?: string;
  working_dir?: string;
  entrypoint?: string[];
  stdin_open?: boolean;
  tty?: boolean;
  command?: string[];
};

const options = new Map<string, Option>([
  ['--name', 'name'],
  ['--env', 'env'],
  ['-e', 'env'],
  ['--publish', 'publish'],
  ['-p', 'publish'],
  ['--volume', 'volume'],
  ['-v', 'volume'],
  ['--restart', 'restart'],
  ['--user', 'user'],
  ['-u', 'user'],
  ['--workdir', 'workdir'],
  ['-w', 'workdir'],
  ['--entrypoint', 'entrypoint'],
]);

// Compose interpolates dollar signs inside string values.
function literal(value: string) {
  return value.replaceAll('$', () => '$$');
}

export function dockerRunToCompose(commandLine: string) {
  if (commandLine.includes('\0')) {
    throw new Error('Remove null characters from the command.');
  }
  if (commandLine.length > 32_768) {
    throw new Error('The command exceeds 32,768 characters.');
  }
  const [docker, subcommand, ...args] = shellWords(commandLine);
  if (docker !== 'docker' || subcommand !== 'run') {
    throw new Error('Enter a command beginning with docker run.');
  }

  const service: ComposeService = { image: '' };
  const namedVolumes = new Set<string>();
  const environment = new Map<string, string>();

  let index = 0;
  while (index < args.length && args[index].startsWith('-')) {
    const argument = args[index];
    if (argument === '--') {
      index += 1;
      break;
    }

    const shortBooleans = /^-[dit]+$/.test(argument);
    if (
      argument === '--interactive' ||
      (shortBooleans && argument.includes('i'))
    ) {
      service.stdin_open = true;
    }
    if (argument === '--tty' || (shortBooleans && argument.includes('t'))) {
      service.tty = true;
    }
    if (
      !shortBooleans &&
      !['--detach', '--interactive', '--tty'].includes(argument)
    ) {
      const parsed = readOption(args, index);
      applyOption(parsed.option, parsed.value);
      index = parsed.lastIndex;
    }
    index += 1;
  }

  const image = args[index];
  if (!image || !/^[a-zA-Z0-9][a-zA-Z0-9._/:@-]*$/.test(image)) {
    throw new Error('Enter a literal Docker image reference.');
  }

  service.image = image;
  if (environment.size) service.environment = Array.from(environment.values());
  if (args.length > index + 1) {
    service.command = args.slice(index + 1).map(literal);
  }

  return YAML.stringify({
    services: { app: service },
    ...(namedVolumes.size && {
      volumes: Object.fromEntries(
        Array.from(namedVolumes, (name) => [name, { name }])
      ),
    }),
  });

  function applyOption(option: Option, value: string) {
    switch (option) {
      case 'name':
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(value)) {
          throw new Error('Enter a valid Docker container name.');
        }
        service.container_name = value;
        break;
      case 'env': {
        const assignment = /^([a-zA-Z_][a-zA-Z0-9_]*)=/.exec(value);
        if (!assignment) {
          throw new Error(
            'Set environment variables explicitly as NAME=value.'
          );
        }
        environment.set(assignment[1], literal(value));
        break;
      }
      case 'publish':
        if (
          !/^(?:(?:[\d.]+|\[[\da-fA-F:]+\]):)?(?:\d*:)?\d+(?:\/(?:tcp|udp|sctp))?$/.test(
            value
          )
        ) {
          throw new Error(
            'Use a single port or an address and host port mapped to one container port.'
          );
        }
        (service.ports ??= []).push(value);
        break;
      case 'volume': {
        const [source, target, access, ...extra] = value.split(':');
        if (target === undefined && source.startsWith('/')) {
          (service.volumes ??= []).push(literal(value));
          break;
        }
        if (
          !source ||
          !target?.startsWith('/') ||
          extra.length ||
          (access !== undefined && !/^(ro|rw)$/.test(access))
        ) {
          throw new Error(
            'Use an absolute volume target, with an optional named or absolute source and ro or rw mode.'
          );
        }
        if (!source.startsWith('/')) {
          if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(source)) {
            throw new Error('Use a volume name or an absolute source path.');
          }
          namedVolumes.add(source);
        }
        (service.volumes ??= []).push(literal(value));
        break;
      }
      case 'restart':
        if (!/^(no|always|unless-stopped|on-failure(?::\d+)?)$/.test(value)) {
          throw new Error(
            'Use no, always, unless-stopped, or on-failure with an optional retry count.'
          );
        }
        service.restart = value;
        break;
      case 'workdir':
        if (!value.startsWith('/')) {
          throw new Error('Use an absolute working directory.');
        }
        service.working_dir = literal(value);
        break;
      case 'user':
        service.user = literal(value);
        break;
      case 'entrypoint':
        service.entrypoint = value ? [literal(value)] : [];
        break;
    }
  }
}

function readOption(args: string[], index: number) {
  const argument = args[index];
  const equals = argument.indexOf('=');
  const flag = equals < 0 ? argument : argument.slice(0, equals);
  const option = options.get(flag);
  if (!option) {
    const flagName = /^--?[a-zA-Z0-9-]+$/.test(flag) ? ` ${flag}` : '';
    throw new Error(`Unsupported Docker run option${flagName}.`);
  }
  const lastIndex = equals < 0 ? index + 1 : index;
  const value = equals < 0 ? args[lastIndex] : argument.slice(equals + 1);
  if (value === undefined || (equals < 0 && value.startsWith('-'))) {
    throw new Error(`${flag} requires a value.`);
  }

  return { option, value, lastIndex };
}

/** Tokenize a single literal shell command without evaluating shell syntax. */
function shellWords(command: string) {
  const words: string[] = [];
  let quote = '';
  let word = '';
  let started = false;
  const input = command.replaceAll('\r\n', '\n').trimStart();

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (!quote && char === '\n' && !input.slice(index).trim()) break;
    if (char === '\\' && quote !== "'") {
      const next = input[index + 1];
      if (next === undefined) throw new Error('Complete the escape sequence.');
      if (next === '\n') {
        index += 1;
      } else {
        if (!quote || ['"', '\\', '$', '`'].includes(next)) {
          word += next;
          index += 1;
        } else {
          word += char;
        }
        started = true;
      }
    } else if (char === quote) {
      quote = '';
    } else if (!quote && (char === '"' || char === "'")) {
      quote = char;
      started = true;
    } else if (
      (quote !== "'" && '$`'.includes(char)) ||
      (!quote &&
        (';&|<>()*?[]{!\n'.includes(char) || (!started && '#~'.includes(char))))
    ) {
      throw new Error(
        'Use a single command with literal arguments. Quote shell characters or replace shell expansions with values.'
      );
    } else if (!quote && /\s/.test(char)) {
      if (started) words.push(word);
      word = '';
      started = false;
    } else {
      word += char;
      started = true;
    }
  }

  if (quote) throw new Error('Close the unbalanced quote.');
  if (started) words.push(word);
  return words;
}
