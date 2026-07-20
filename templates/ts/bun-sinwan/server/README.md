# Server Runtime

Sinwan Bun currently uses Bun's built-in bundler and runtime. In future releases, the project will transition to **Voltpack**, a dedicated bundler and server runtime designed for Sinwan. Voltpack is built on top of Bun's build tooling, leveraging its native performance while adding Sinwan-specific optimizations.

## Migration

The migration to Voltpack will be seamless. No changes to your project structure or source code will be required. Existing applications will continue to work as-is.

To adopt Voltpack:

1. Install the Voltpack package.
2. Add a minimal configuration file.
3. Your existing Sinwan Bun application runs as-is.

Prefer Bun's built-in runtime? Sinwan will continue to support Bun natively in future releases with full compatibility.
