(function($) {

  'use strict';

  function splitpage(target, args, options) {
    this.target = $(target);
    this.options = $.isPlainObject(options) ? options : { url: options };
    this.args = $.isPlainObject(args) ? args : {};
    this.page = 1;
    this.update();
  }

  splitpage.prototype.configure = function(args, options) {
    if(args) this.args = $.isPlainObject(args) ? $.extend({}, args) : {};
    if(options) this.options = $.isPlainObject(options) ? $.extend(this.options, options) : { url: options };
  };

  splitpage.prototype.update = function() {
    this.load(this.page);
  };

  splitpage.prototype.load = function(page) {
    page = page || 1;
    if(page < 1) page = 1;
    this.page = 1;

    var $this = this;
    $.ajax($.extend({
      type: 'POST',
      context: this.target
    }, this.options, {
      data: $.extend({}, this.args, { page_num: page }),
      success: function(data, textStatus, jqXHR) {
        $this.dosplit.call($this, page, data);
        $this.target.trigger('split-page:success', [data, textStatus, jqXHR]);
      },
      error: function(jqXHR, textStatus, errorThrowns) {
        $this.target.trigger('split-page:error', [jqXHR, textStatus, errorThrowns]);
      },
      complete: function(jqXHR, textStatus) {
        $this.target.trigger('split-page:complete', [jqXHR, textStatus]);
      },
      beforeSend: function() {
        if($this.options.beforeSend) $this.options.beforeSend.apply(this, arguments);
      }
    }));
  };

  splitpage.prototype.dosplit = function(page, data) {
    var $this = this, buttons = [], btnDisplay = '', btnClass = '', curPage = 0, button,
        spliter = this.target.find('.pagination-wrapper').html('<ul class="pagination"></ul>').find('.pagination');
    if(!data.total) data.total++;
    if(page > data.total) return splitpage(data.total, type);

    page--;
    buttons.push('first');
    buttons.push('previous');
    $.merge(buttons, _numbers(page, data.total));
    buttons.push('next');
    buttons.push('last');

    for(var i = 0, len = buttons.length; i < len; i++) {
      button = buttons[i];
      btnDisplay = '';
      btnClass = '';
      switch(button) {
        case 'ellipsis':
          btnDisplay = '&hellip;';
          btnClass += 'ellipsis disabled';
          break;
        case 'first':
          btnDisplay = '首页';
          btnClass += button + (page > 0 ? '' : ' disabled');
          curPage = 1;
          break;
        case 'previous':
          btnDisplay = '&laquo;';
          btnClass += button + (page > 0 ? '' : ' disabled');
          curPage = page;
          break;
        case 'next':
          btnDisplay = '&raquo;';
          btnClass += button + (page < data.total - 1 ? '' : ' disabled');
          curPage = page + 2;
          break;
        case 'last':
          btnDisplay = '尾页';
          btnClass += button + (page < data.total - 1 ? '' : ' disabled');
          curPage = data.total;
          break;
        default:
          btnDisplay = button + 1;
          btnClass += page === button ? 'active' : '';
          curPage = button + 1;
          break;
      }

      if (btnDisplay) {
        $('<li></li>', {
          'class': btnClass
        }).data('page', curPage).html('<a href="#">' + btnDisplay + '</a>').appendTo(spliter);
      }
    }

    spliter.find('li > a').on('click', function() {
      var $li = $(this).closest('li');
      if($li.is(':not(.active):not(.disabled):not(.ellipsis)')) {
        $this.load($(this).closest('li').data('page'));
      }
      return false;
    });
  };

  $.fn.splitpage = function(method, options, args) {
    var spliter = $(this).data('split-page');
    if(!spliter) {
      if(args === undefined) {
        args = options;
        options = method;
        method = null;
      }
      spliter = new splitpage(this, args, options);
      $(this).data('split-page', spliter);
    }
    switch(method) {
      case 'load':
      case 'split':
      case 'page':
        var page = options.constructor === Number ? options : parseInt(options);
        spliter.load(page);
        break;
      case 'update':
      case 'reload':
        spliter.update();
        break;
      case 'configure':
        spliter.configure(args, options);
        break;
      case 'destroy':
        $(this).data('split-page', null);
        break;
    }
    return this;
  };

  function _numbers(page, pages, buttons) {
    buttons = buttons || 7;
    var numbers = [], half = Math.floor( buttons / 2 );
    if(pages <= buttons) {
      numbers = _range(0, pages);
    } else if(page <= half ) {
      numbers = _range(0, buttons - 2);
      numbers.push('ellipsis');
      numbers.push(pages - 1);
    } else if(page >= pages - 1 - half) {
      numbers = _range(pages - (buttons - 2), pages);
      numbers.splice(0, 0, 'ellipsis');
      numbers.splice(0, 0, 0);
    } else {
      numbers = _range(page - 1, page + 2);
      numbers.push('ellipsis');
      numbers.push(pages - 1);
      numbers.splice(0, 0, 'ellipsis');
      numbers.splice(0, 0, 0);
    }
    return numbers;
  }

  function _range(len, start) {
    var out = [];
    var end;
    if(start === undefined) {
      start = 0;
      end = len;
    } else {
      end = start;
      start = len;
    }
    for(var i = start; i < end ; ++i) {
      out.push(i);
    }
    return out;
  }

})(jQuery);
