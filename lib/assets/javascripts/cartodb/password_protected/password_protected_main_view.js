var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var VendorScriptsView = require('../common/vendor_scripts_view');

var REQUIRED_OPTIONS = [
  'data',
  'vizID',
  'hosted',
  'assetsVersion',
  'handleRedirection'
];

var ENTER_KEY_CODE = 13;
var API_URL = _.template('/api/v1/viz/<%- uuid %>');

module.exports = cdb.core.View.extend({
  events: {
    'input .js-input': '_cleanError'
  },

  initialize: function (options) {
    _.each(REQUIRED_OPTIONS, function (item) {
      if (options[item] === undefined) throw new Error('password_protected view: ' + item + ' is required');
      this[item] = options[item];
    }, this);

    this._onKeyDownBinded = this._onKeyDown.bind(this);
    this._checkPassword = this._checkPassword.bind(this);
    this._handleRejection = this._handleRejection.bind(this);
    this.template = cdb.templates.getTemplate('password_protected/views/main');

    this.url = API_URL({
      uuid: this.vizID
    });

    this.model = new cdb.core.Model({
      password: '',
      error: false
    });

    this._initBinds();
    this._initVendorViews();
  },

  render: function () {
    this._removeKeyDownBinds();
    this.clearSubViews();
    this.$el.html(this.template({
      hasError: this.model.get('error'),
      home: 'http://carto.com',
      title: _t('protected_map.content.header'),
      hint: _t('protected_map.content.tip'),
      placeholder: _t('protected_map.content.placeholder'),
      error: _t('protected_map.content.error')
    }));

    this._applyKeyDownBinds();
    this._focusInput();
    return this;
  },

  _initBinds: function () {
    this.model.on('change:error', this.render, this);
  },

  _initVendorViews: function () {
    var vendorScriptsView = new VendorScriptsView({
      config: this.data.config,
      assetsVersion: this.assetsVersion
    });
    this.$el.append(vendorScriptsView.render().el);
    this.addView(vendorScriptsView);
  },

  _checkPassword: function () {
    var password = this.model.get('password');
    this._removeKeyDownBinds();

    $.ajax({
      url: this.url,
      data: {
        password: password
      }
    })
      .done(this.handleRedirection)
      .fail(this._handleRejection);
  },

  _handleRejection: function () {
    this.model.set('error', true);
  },

  _cleanError: function () {
    this.model.set({
      password: this.$('.js-input').val(),
      error: false
    });
  },

  _focusInput: function () {
    var password = this.model.get('password');
    // A bit hacky but it's nice to put the caret after the content
    this.$('.js-input').focus();
    this.$('.js-input').val(password);
  },

  _onKeyDown: function (event) {
    var key = event.which;

    if (key === ENTER_KEY_CODE) {
      this._checkPassword();
    }
  },

  _applyKeyDownBinds: function () {
    document.addEventListener('keydown', this._onKeyDownBinded);
  },

  _removeKeyDownBinds: function () {
    document.removeEventListener('keydown', this._onKeyDownBinded);
  },

  clean: function () {
    this._removeKeyDownBinds();
    cdb.core.View.prototype.clean.apply(this);
  }
});