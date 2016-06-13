var MemberWidget = (function($) {

  'use strict';

  var tpl_main = '<div class="member-widget-filters">\
    <select class="member-selector form-control select2 input-sm"></select>\
    <a data-group="*" class="group-selector inactive">所有人</a>\
  </div>\
  <div class="member-widget-grid allow-remove"></div>';

  var tpl_filter = '<a data-group="{{id}}" class="group-selector">{{text}}</a>';

  var tpl_cbpitem = '<div class="cbp-item {{reserved}}" data-id="{{id}}" data-group="{{group}}">\
    <a class="member" href="#">\
      <img class="avatar img-circle" src="{{avatar_url}}">\
      <div class="name">{{name}}</div>\
      <div class="group">{{group_desc}}</div>\
    </a>\
  </div>';

  function render(template, data) {
    data = data || {};
    return template.replace(/\{\{\s*([a-zA-Z0-9_\$\-\.]+)\s*\}\}/g, function(match, variable, offset) {
      variable = variable.replace(/\[(\w+)\]/g, '.$1');
      variable = variable.replace(/^\./, '');
      var levels = variable.split('.');
      var _data = data;
      for(var i = 0; i < levels.length; ++i) {
        if(_data === undefined || _data === null) {
          return '';
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
    ids = $(ids).not(this._selected).get();
    this._selected = this._selected.concat(ids);
    this._add_cbp_item(ids);
    this._remove_option(ids);
    this._update_group_selector();
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
    this._selected = $(this._selected).not(ids).get();
    this._remove_cbp_item($item);
    this._add_option(ids);
    this._update_group_selector();
  };

  widget.prototype.add_group = function(id) {
    if(this._groups[id]) {
      this.add(this._groups[id]);
    }
  };

  widget.prototype.remove_group = function(id) {
    if(this._groups[id]) {
      this.remove(this._groups[id]);
    }
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
    this._update_group_selector();
  };

  widget.prototype._init_data = function() {
    var self = this;
    this._members = {};
    this._filters = {};
    this._groups = {};
    this._groups['*'] = [];
    this._reserved = $.map(this.options.reserved, function(id) {
      return '' + id;
    });
    $.each(this.options.members, function() {
      var id = '' + this.id;
      self._members[id] = {
        id: id,
        name: this.name,
        avatar_url: this.avatar_url,
        group: this.group,
        group_desc: this.group_desc,
        reserved: $.inArray(id, self._reserved) > -1 ? 'reserved' : ''
      }
      if(!self._groups[this.group]) {
        self._groups[this.group] = [];
      }
      self._groups[this.group].push(id);
      self._groups['*'].push(id);
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
        self._filters[this.group] = this.group_desc;
      });
    }
  };

  widget.prototype._init_dom = function() {
    var self = this;
    $.each(this._filters, function(id, text) {
      self._add_filter(id, text);
    });
    this.$grid.append(this._add_cbp_item(this._selected, true));
    if(this.options.enable_selector) {
      var not_selected = $(Object.keys(this._members)).not(this._selected).get();
      this._add_option(not_selected);
      this._update_group_selector();
    } else {
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
    this.$filters.on('click', '.group-selector', function(e) {
      e.preventDefault();
      var $filter = $(this);
      var group = $filter.attr('data-group');
      if($filter.hasClass('active')) {
        self.remove_group(group);
      } else if($filter.hasClass('inactive') || $filter.hasClass('indeterminate')) {
        self.add_group(group);
      }
    })
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
    this.$grid.cubeportfolio();
  };

  widget.prototype._add_cbp_item = function(id, return_html, callback) {
    var self = this;
    if(this._busy) {
      return false;
    }
    var ids = $.isArray(id) ? id : [id];
    var html = $.map(ids, function(id) {
      if(self._members[id]) {
        return render(tpl_cbpitem, self._members[id]);
      }
    });
    if(return_html) {
      return html;
    }
    this._busy = true;
    this.$grid.cubeportfolio('appendItems', html.join('\n'), function() {
      self._busy = false;
      if(callback) {
        callback.call(null);
      }
    });
  };

  widget.prototype._remove_cbp_item = function($item, callback) {
    var self = this;
    if(this._busy) {
      return false;
    }
    this._busy = true;
    this.$grid.cubeportfolio('remove', $item, function() {
      self._busy = false;
      if(callback) {
        callback.call(null);
      }
    });
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

  widget.prototype._update_group_selector = function() {
    if(!this.options.enable_selector) {
      return false;
    }
    var self = this;
    $.each(this._groups, function(group_id, group) {
      var count = 0;
      for(var i = 0; i < group.length; ++i) {
        if($.inArray(group[i], self._selected) > -1) {
          ++count;
        }
      }
      if(count == 0) {
        self.$filters.find('[data-group="' + group_id + '"]').removeClass('active indeterminate').addClass('inactive');
      } else if(count == group.length) {
        self.$filters.find('[data-group="' + group_id + '"]').removeClass('inactive indeterminate').addClass('active');
      } else {
        self.$filters.find('[data-group="' + group_id + '"]').removeClass('active inactive').addClass('indeterminate');
      }
    });
    var $select_all = self.$filters.find('[data-group="*"]');
    var filters = self.$filters.find('[data-group]').not('[data-group="*"]');
    if(filters.filter('.active').length == filters.length) {
      $select_all.removeClass('inactive indeterminate').addClass('active');
    } else if(filters.filter('.inactive').length == filters.length) {
      $select_all.removeClass('active indeterminate').addClass('inactive');
    } else {
      $select_all.removeClass('active inactive').addClass('indeterminate');
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
      case 'destroy':
        $(this).empty();
        $(this).data('member-widget', null);
        instance = null;
        break;
    }
    return this;
  };

  return widget;

})(jQuery);
