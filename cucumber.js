module.exports = {
  default: {
    require: [
      'src/steps/**/*.js'
    ],
    paths: [
      'src/features/**/*.feature'
    ],
    publishQuiet: true
  }
};
