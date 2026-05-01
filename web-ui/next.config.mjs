/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid broken server bundles for micromark / react-markdown during static collection
  serverExternalPackages: [
    "react-markdown",
    "remark-gfm",
    "remark-parse",
    "unified",
    "micromark",
    "micromark-core-commonmark",
    "mdast-util-from-markdown",
    "mdast-util-to-hast",
    "hast-util-to-jsx-runtime"
  ]
};

export default nextConfig;

