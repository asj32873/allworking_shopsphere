module.exports = function (api) {
  api.env("test");

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: {
            node: "current",
          },
          modules: "commonjs",
        },
      ],
      [
        "@babel/preset-react",
        {
          runtime: "automatic",
        },
      ],
    ],

    plugins: [
      "babel-plugin-transform-import-meta",
      "babel-plugin-transform-vite-meta-env",
    ],
  };
};
