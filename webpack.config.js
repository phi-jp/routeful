module.exports = {
  entry: "./src/index.js",  // メインとなるJavaScriptファイル（エントリーポイント）
  output: {  // ファイルの出力設定
    // path: "./",  //  出力ファイルのディレクトリ名
    filename: "routeful.js",  // 出力ファイル名
    libraryTarget: 'var',
    library: "Routeful",
  }
};
