// "quotes": [2, "double"]
// # 第一部分是规则名
// # 第二部分是表示级别：0-不验证；1-警告；2-错误

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'standard',
  globals: {
    __static: true
  },
  plugins: [
    'html'
  ],
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    "space-before-function-paren": [0, "always"],//函数定义时括号前面要不要有空格
    "no-unused-vars": [0, {"vars": "all", "args": "after-used"}],
    "curly": 0 //if、else、while、for代码块用{}包围
  }
}
