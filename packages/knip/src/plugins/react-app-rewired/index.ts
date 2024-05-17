import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import { webpack } from '../index.js';
import type { PluginConfig } from './types.js';
import path from 'path';

// link to react-app-rewired docs

const title = 'reactAppRewired';

const enablers: EnablerPatterns = ['react-app-rewired'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['config-overrides.{js,ts,mjs,cjs,mts,cts}'];

const resolveConfig: ResolveConfig<PluginConfig> = async (config, options) => {
  const workspaceRoot = options.configFileDir;

  // like "/Users/bytedance/projects/itam-mono-2/byte/web/node_modules/.pnpm/react-app-rewired@2.1.3_react-scripts@3.4.4/node_modules/react-app-rewired"
  // const reactAppRewiredDependentPath = path.dirname(
  //   require.resolve('react-app-rewired/index.js', { paths: [options.configFileDir] }),
  // );

  const reactAppRewired = await import(`${workspaceRoot}/node_modules/react-app-rewired/index.js`);

  const { scriptVersion } = reactAppRewired.default.paths;
  if (!scriptVersion) {
    throw Error('code error: scriptVersion is empty');
  }

  process.env.NODE_ENV = 'development';
  const { default: webpackConfigFn } = await import(path.resolve(scriptVersion, './config/webpack.config.js'));

  const configOverridesWebpack = (config as any).webpack;

  if (typeof configOverridesWebpack !== 'function') {
    throw Error('only support webpack fn case for now');
  }

  const webpackConfig = configOverridesWebpack(webpackConfigFn(process.env.NODE_ENV));
  delete process.env.NODE_ENV;

  return webpack.resolveConfig(webpackConfig, options);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production: webpack.production,
  resolveConfig,
} satisfies Plugin;
