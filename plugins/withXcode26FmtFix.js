const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'Xcode 26 fmt workaround';

const FMT_PATCH = `
    # ${MARKER}: fmt 11.0.2 consteval checks fail on Apple Clang 21+ (react-native#55601)
    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      content = File.read(fmt_base)
      unless content.include?('${MARKER}')
        patched = content.gsub(
          /(#elif defined\\(__cpp_consteval\\)\\n#  define FMT_USE_CONSTEVAL) 1/,
          "\\\\1 0 // ${MARKER}"
        )
        if patched != content
          File.chmod(0644, fmt_base)
          File.write(fmt_base, patched)
        end
      end
    end
`;

function withXcode26FmtFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (contents.includes(MARKER)) {
        return config;
      }

      const anchor = 'react_native_post_install(';
      const anchorIndex = contents.indexOf(anchor);
      if (anchorIndex === -1) {
        return config;
      }

      const postInstallClose = contents.indexOf('\n  end', anchorIndex);
      if (postInstallClose === -1) {
        return config;
      }

      contents =
        contents.slice(0, postInstallClose) + FMT_PATCH + contents.slice(postInstallClose);
      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
}

module.exports = withXcode26FmtFix;
