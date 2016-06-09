var MemberWidget = (function($) {

  'use strict';

  var tpl_main = '<div class="member-widget-filters">\
    <select class="member-selector form-control select2 input-sm"></select>\
    <a data-filter="*" class="cbp-filter-item cbp-filter-item-active">显示全部 <span class="cbp-filter-counter"></span></a>\
  </div>\
  <div class="member-widget-grid allow-remove"></div>';

  var tpl_filter = '<a data-filter="[data-position={{id}}]" data-id="{{id}}" class="cbp-filter-item">{{text}} <span class="cbp-filter-counter"></span></a>';

  var tpl_cbpitem = '<div class="cbp-item {{reserved}}" data-id="{{id}}" data-position="{{position}}">\
    <a class="member" href="#">\
      <img class="avatar img-circle" src="{{avatar_url}}">\
      <div class="name">{{name}}</div>\
      <div class="position">{{position_desc}}</div>\
    </a>\
  </div>';

  function render(template, data) {
    data = data || {};
    return template.replace(/\{\{\s*([a-zA-Z0-9_\$\-\.]+)\s*\}\}/g, function(match, variable, offset) {
      var levels = variable.split('.');
      var _data = data;
      for(var i = 0; i < levels.length; ++i) {
        if(_data === undefined || _data === null) {
          break;
        }
        _data = _data[levels[i]];
      }
      if(_data === undefined || _data === null) {
        _data = '';
      }
      return _data;
    });
  }

  function widget(container, options) {
    this._members = {};
    this._filters = {};
    this._selected = [];
    this._reserved = [];
    this.options = $.extend({}, widget.defaults, options);

    Object.defineProperty(this, 'val', { get: widget.prototype.get_selected, set: widget.prototype.set_selected });
    Object.defineProperty(this, 'value', { get: widget.prototype.get_selected, set: widget.prototype.set_selected });
    Object.defineProperty(this, 'selected', { get: widget.prototype.get_selected });

    this.$container = $(container);
    this.$container.html(tpl_main);
    this.$filters = this.$container.find('> .member-widget-filters');
    this.$selector = this.$filters.find('> .member-selector');
    this.$grid = this.$container.find('> .member-widget-grid');

    this._init_data();
    this._init_dom();
    this._init_selector();
    this._init_cbp();
  }

  widget.defaults = {
    members: [],
    filters: [],
    selected: [],
    reserved: [],
    enable_filters: true,
    enable_selector: true,
    allow_remove: true
  };

  widget.prototype.configure = function(options) {
    var self = this;

    if(options.members) {
      if(!options.filters) {
        options.filters = this.options.filters;
      }
      if(!options.selected) {
        options.selected = this._selected;
      }
      if(!options.reserved) {
        options.reserved = this.options.reserved;
      }
      return widget(this.$container, options); // re-initialize
    }

    if(options.filters && $.isArray(options.filters) && options.filters.length) {
      self._filters = {};
      $.each(options.filters, function() {
        self._filters[this.id] = this.text;
        self._add_filter(this.id, this.text);
      });
    }

    if(options.reserved) {
      this._reserved = $.map(options.reserved, function(id) {
        return '' + id;
      }).get();
    }

    if(options.selected) {
      this.set_selected(options.selected);
    }

    $.extend(this.options, options);
  };

  widget.prototype.toString = widget.prototype.get_selected;

  widget.prototype.add = function(id) {
    var ids = $.isArray(id) ? id : [id];
    this._add_cbp_item(ids);
    this._remove_option(ids);
  };

  widget.prototype.remove = function(target) {
    var self = this;
    var $item, id;
    target = $.isArray(target) ? target : [target];
    $item = $();
    if(typeof target[0] == 'number' || typeof target[0] == 'string') {
      $.each(target, function() {
        if($.inArray(this, self._reserved) < 0) {
          $item = $item.add(self.$grid.find('.cbp-item[data-id="' + this + '"]'));
        }
      });
    } else {
      $.each(target, function() {
        var item = $(this).closest('.cbp-item');
        if(!item.hasClass('reserved')) {
          $item = $item.add(item);
        }
      });
    }
    var ids = $item.map(function(index, item) {
      return $(item).attr('data-id');
    }).get();
    this._remove_cbp_item($item);
    this._add_option(ids);
  };

  widget.prototype.get_selected = function() {
    return this._selected.slice(); // clone
  }

  widget.prototype.set_selected = function(selected) {
    if(!$.isArray(selected) && !$.isPlainObject(selected)) {
      return false;
    }
    var self = this;
    var _selected = $.map(selected, function(id) {
      if(self._members[id]) {
        return '' + id;
      }
    });
    var added = $(_selected).not(this._selected).get();
    var removed = $(this._selected).not(_selected).get();
    this._selected = _selected.slice();
    var $items_removed = $();
    $.each(removed, function() {
      $items_removed = $items_removed.add(self.$grid.find('.cbp-item[data-id="' + this + '"]'));
    });
    this._remove_cbp_item($items_removed, function() {
      self._add_cbp_item(added);
    });
    this._add_option(removed);
    this._remove_option(added);
  };

  widget.prototype._init_data = function() {
    var self = this;
    this._members = {};
    this._filters = {};
    this._reserved = $.map(this.options.reserved, function(id) {
      return '' + id;
    });
    $.each(this.options.members, function() {
      var id = '' + this.id;
      self._members[id] = {
        id: id,
        name: this.name,
        avatar_url: this.avatar_url,
        position: this.position,
        position_desc: this.position_desc,
        reserved: $.inArray(id, self._reserved) > -1 ? 'reserved' : ''
      }
    });
    this._selected = $.map(this.options.selected, function(id) {
      if(self._members[id]) {
        return '' + id;
      }
    });
    if($.isArray(this.options.filters) && this.options.filters.length) {
      $.each(this.options.filters, function() {
        self._filters[this.id] = this.text;
      });
    } else {
      $.each(this._members, function() {
        self._filters[this.position] = this.position_desc;
      });
    }
  };

  widget.prototype._init_dom = function() {
    var self = this;
    $.each(this._filters, function(id, text) {
      self._add_filter(id, text);
    });
    this.$grid.append(this._add_cbp_item(this._selected, true));
    if(!this.options.enable_filters) {
      this.$filters.find('.cbp-filter-item').addClass('hidden');
    }
    if(this.options.enable_selector) {
      var not_selected = $(Object.keys(this._members)).not(this._selected).get();
      this._add_option(not_selected);
    } else {
      this.$filters.find('.select2').addClass('hidden');
    }
    if(!this.options.enable_filters && !this.options.enable_selector) {
      this.$filters.addClass('hidden');
    }
  };

  widget.prototype._init_selector = function() {
    if(!this.options.enable_selector) {
      return;
    }
    var self = this;
    $.fn.select2.defaults.set('language', 'zh-CN');
    this.$selector.select2({
      placeholder: '点击添加成员',
      dropdownParent: this.$container
    }).on('change.member-widget', function(e) {
      var id = $(this).val();
      self.add(id);
      self.$selector.val(null).trigger('change.select2');
    });
    this.$selector.val(null).trigger('change.select2');
  };

  widget.prototype._init_cbp = function() {
    var self = this;
    if(this.options.allow_remove) {
      this.$grid.on('click', '.member', function(e) {
        e.preventDefault();
        self.remove(this);
      });
    } else {
      this.$grid.on('click', '.member', function(e) {
        e.preventDefault();
      }).removeClass('allow-remove');
    }
    this.$grid.cubeportfolio({
      filters: this.$filters
    });
  };

  widget.prototype._add_cbp_item = function(id, return_html) {
    var self = this;
    var ids = $.isArray(id) ? id : [id];
    var html = $.map(ids, function(id) {
      if(self._members[id]) {
        return render(tpl_cbpitem, self._members[id]);
      }
    });
    if(return_html) {
      return html;
    }
    this.$grid.cubeportfolio('appendItems', html.join('\n'));
  };

  widget.prototype._remove_cbp_item = function($item, callback) {
    this.$grid.cubeportfolio('remove', $item, callback);
  };

  widget.prototype._add_filter = function(id, text) {
    this.$filters.append(render(tpl_filter, {
      id: id,
      text: text
    }));
  };

  widget.prototype._remove_filter = function(id) {
    var ids = $.isArray(id) ? id : [id];
    var self = this;
    $.each(ids, function() {
      self.$filters.find('.cbp-filter-item[data-id="' + this + '"]').remove();
    });
  };

  widget.prototype._add_option = function(id, remain_selected) {
    var ids = $.isArray(id) ? id : [id];
    var self = this;
    this.$selector.append($.map(ids, function(id) {
      if(self._members[id]) {
        return '<option value="' + id + '">' + self._members[id].name + '</option>';
      }
    }));
    this.$selector.val(null).trigger('change.select2');

    if(!remain_selected) {
      this._selected = $(this._selected).not(ids).get(); // selected - ids
    }
  };

  widget.prototype._remove_option = function(id, remain_selected) {
    var ids = $.isArray(id) ? id : [id];
    var self = this;
    $.each(ids, function() {
      self.$selector.find('option[value="' + this + '"]').remove();
    });
    this.$selector.val(null).trigger('change.select2');

    if(!remain_selected) {
      this._selected = $.unique(this._selected.concat(ids));
    }
  };

  $.fn.memberWidget = function(action, value) {
    var instance = $(this).data('member-widget');
    if(!instance) {
      var options = {};
      if($.isPlainObject(action)) {
        options = action;
      } else if(action == 'init' && $.isPlainObject(value)) {
        options = value;
      }
      instance = new widget(this, options);
      $(this).data('member-widget', instance);
    }
    switch(action) {
      case 'val':
      case 'value':
      case 'selected':
        return instance.selected;
      case 'config':
      case 'configure':
        instance.configure(value);
        break;
      case 'add':
        instance.add(value);
        break;
      case 'delete':
      case 'remove':
        instance.remove(value);
        break;
      case 'get':
      case 'get_selected':
        instance.get_selected();
        break;
      case 'set':
      case 'set_selected':
        instance.set_selected(value);
        break;
    }
    return this;
  };

  return widget;

})(jQuery);
