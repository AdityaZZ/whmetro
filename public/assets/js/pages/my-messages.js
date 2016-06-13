var MyMessages = (function($) {

  'use strict';

  var options = {
    defaults: {
      message: {
        top_right_corner: '',
        enable_comment: false,
        show_comment_list: false,
        more_comments_btn: false
      },
      comment: {}
    },
    message: {
      map: {},
      translate: function() {},
      load: {
        url: '',
        method: 'GET',
        enctype: 'application/x-www-form-urlencoded',
        data: {}
      },
      acknowledge: {
        url: '',
        method: 'POST',
        enctype: 'application/x-www-form-urlencoded',
        data: {}
      },
      offset: undefined
    },
    comment: {
      map: {},
      translate: function() {},
      load: {
        url: '',
        method: 'GET',
        enctype: 'application/x-www-form-urlencoded',
        data: {}
      },
      reply: {
        url: '',
        method: 'POST',
        enctype: 'application/x-www-form-urlencoded',
        data: {}
      }
    }
  };

  // Templates
  var tpl_message = $('#template-message').html() || '<li class="message__item media{% if notice %} notice{% endif %}" data-id="{{id}}" data-time="{{timestamp}}">\
  <div class="media-left">\
    {% if author_url %}<a href="{{author_url}}">{% endif %}<img class="img-circle" src="{{avatar_url}}">{% if author_url %}</a>{% endif %}\
  </div>\
  <div class="media-body">\
    <h4 class="media-heading">{% if author_url %}<a href="{{author_url}}">{% endif %}{{author}}{% if author_url %}</a>{% endif %}<small>{{date}}</small></h4>\
    <div class="top-right-corner">\
      {{top_right_corner | safe}}\
    </div>\
    <div class="message__item-content{% if shrink %} shrinked{% endif %}">\
      {% if heading %}<div class="message__item-content__heading">{{heading}}</div>{% endif %}\
      {{message | safe}}\
      <div class="message__item-mask"></div>\
      <a href="#" class="collapse-button"></a>\
    </div>\
    {% if reply_quote %}\
    <div class="reply-quote" data-label="回复我的评论：">{{reply_quote}}</div>\
    {% endif %}\
    <ul class="message__labels">\
      {% for label in labels %}\
      <li class="label {{label.type}}" data-id="{{label.id}}">{% if label.url %}<a href="{{label.url}}">{% endif %}{{label.name}}{% if label.url %}</a>{% endif %}</li>\
      {% endfor %}\
    </ul>\
    {% if acknowledge %}<button type="button" class="btn btn-primary btn-lg btn-block message__ack-btn">确认收到</button>{% endif %}\
  </div>\
  {% if enable_comment %}\
  <div class="comment-box">\
    <form class="comment-box__form" action="#" method="post" enctype="multipart/form-data">\
      <input class="comment-box__file-picker hidden" type="file" />\
      <img class="img-circle" src="{{avatar_url}}">\
      <div class="input-group">\
        <div class="input-wrapper">\
          <div class="reply-quote" data-label=""></div>\
          <textarea class="form-control" name="comment" rows="1" maxlength="255" placeholder="回复{{author}}"></textarea>\
          <button type="button" class="close" aria-label="取消"><span aria-hidden="true">&times;</span></button>\
        </div>\
        <span class="input-group-btn">\
          <button type="button" class="btn btn-default comment-box__image-btn"><i class="fa fa-picture-o"></i></button>\
          <button type="submit" class="btn btn-default comment-box__reply-btn">回复</button>\
        </span>\
      </div>\
      <div class="image-box">\
        <ul></ul>\
        <a href="#" class="add-image"><i class="fa fa-plus"></i></a>\
      </div>\
    </form>\
    {% if show_comment_list %}\
    <ul class="comment-box__list media-list"></ul>\
    {% if more_comments_btn %}\
    <div class="pagination-wrapper"></div>\
    <a href="#" class="comment-box__show-more">点击查看更多</a>\
    <a href="#" class="comment-box__show-less">点击收起评论列表</a>\
    {% endif %}\
    {% endif %}\
  </div>\
  {% endif %}\
</li>';
  var tpl_comment = $('#template-comment').html() || '<li class="comment-box__item media" data-id="{{id}}" data-time="{{timestamp}}">\
  <div class="media-left">\
    <a href="{{author_url}}"><img class="img-circle" src="{{avatar_url}}"></a><a href="{{author_url}}">{{author}}</a>\
  </div>\
  <div class="media-body">\
    <div class="comment-box__item-main">\
      <div class="reply-name">{% if reply_to %}{% if reply_to.profile_url %}<a href="{{reply_to.profile_url}}">{% endif %}{{reply_to.name}}{% if reply_to.profile_url %}</a>{% endif %}{% endif %}</div>\
      <div class="comment-box__item-content">{{message | safe}}</div>\
    </div>\
    <div class="comment-box__item-toolbox">\
      <span class="time">{{time}}</span>\
      <a href="#" class="reply-link">回复</a>\
    </div>\
  </div>\
</li>';
  if(window.nunjucks) {
    tpl_message = nunjucks.compile(tpl_message);
    tpl_comment = nunjucks.compile(tpl_comment);
  } else {
    tpl_message.__proto__.render =
    tpl_comment.__proto__.render = function() {
      return false;
    }
  }

  function timestamp_to_datetime(timestamp, format) {
    var object;
    format = format || 'YYYY-MM-DD HH:mm:ss';
    if(timestamp > 10000000000) {
      object = moment(timestamp);
    } else {
      object = moment.unix(timestamp);
    }
    return object.format(format);
  }
  window.timestamp_to_datetime = timestamp_to_datetime;

  function timestamp_to_date(timestamp, format) {
    var object;
    format = format || 'YYYY-MM-DD';
    if(timestamp > 10000000000) {
      object = moment(timestamp);
    } else {
      object = moment.unix(timestamp);
    }
    return object.format(format);
  }
  window.timestamp_to_date = timestamp_to_date;

  function access_object_by_path(object, path) {
    path = path.replace(/\[(\w+)\]/g, '.$1');
    path = path.replace(/^\./, '');
    var keys = path.split('.');
    for(var i = 0, n = keys.length; i < n; ++i) {
      var key = keys[i];
      if(key in object) {
        if(object === undefined || object === null) {
          return object;
        }
        object = object[key];
      } else {
        return;
      }
    }
    return object;
  }

  function init_message_load_more() {
    $('.message__load-more').on('click', function(e) {
      e.preventDefault();
      var $btn = $(this).blur();
      if($btn.hasClass('disabled') || $btn.hasClass('loading')) {
        return;
      }
      $btn.addClass('loading');
      var settings = options.message.load;
      var request_payload = $.extend({}, settings.data, {
        offset: options.message.offset
      });
      request(settings.method, settings.url, settings.enctype, request_payload, function(data) {
        $btn.removeClass('loading');
        var messages = [];
        options.message.offset = data.offset;
        if(!data.object.length) {
          return $btn.addClass('disabled');
        }
        $.each(data.object, function() {
          // var params = translate_object(this, options.message.map, options.defaults.message);
          var params = $.extend({}, options.defaults.message, options.message.translate(this));
          var html = tpl_message.render(params);
          var $message = $(html);
          $message.find('.comment-box__list').append($.map(this.complexComments, function(comment) {
            var params = $.extend({}, options.defaults.comment, options.comment.translate(comment));
            return tpl_comment.render(params);
          }));
          messages.push($message);
        });
        $('ul.message').append(messages);
      }, function(error) {
        $btn.removeClass('loading');
      });
    });
  }

  function init_acknowledge_button() {
    $('.message').on('click', '.message__ack-btn', function(e) {
      e.preventDefault();
      var $ack_btn = $(this);
      var $msg_item = $ack_btn.closest('.message__item');
      if($ack_btn.prop('disabled')) {
        return false;
      }
      $ack_btn.text('确认中...').prop('disabled', true);
      var settings = options.message.acknowledge;
      var request_payload = $.extend({}, settings.data, {
        id: $msg_item.data('id')
      });
      request(settings.method, settings.url, settings.enctype, request_payload, function(data) {
        $ack_btn.addClass('hidden');
        $msg_item.removeClass('notice');
        alert(data.message);
      }, function(error, jqxhr, textStatus) {
        $ack_btn.text('确认收到').prop('disabled', false);
        alert(error.message || error);
      });
    });
  }

  function init_collapse_button() {
    $('.message').on('click', '.message__item-content .collapse-button', function(e) {
      e.preventDefault();
      var $msg_main = $(this).blur().closest('.message__item-content');
      $msg_main.toggleClass('expanded shrinked');
    });
  }

  function init_image_box() {
    $('.message').on('click', '.comment-box__image-btn', function(e) {
      e.preventDefault();
      var $img_btn = $(this).blur();
      var $msg_item = $img_btn.closest('.message__item');
      var $img_box = $msg_item.find('.image-box');
      $img_box.toggleClass('show');
    });

    $('.message').on('click', '.image-box > .add-image', function(e) {
      e.preventDefault();
      if(typeof FormData == 'undefined') {
        return alert('您的浏览器不支持该功能！请使用 Chrome、Firefox、Edge 或 IE11');
      }
      $(this).closest('.comment-box__form').find('.comment-box__file-picker')[0].click();
    });

    $('.message').on('change', '.comment-box__file-picker', function(e) {
      var $this = $(this);
      var $form = $this.closest('.comment-box__form');
      var $image_box = $form.find('.image-box');
      var $list = $image_box.find('> ul');
      if(this.files.length + $list.find('> li').length > 9) {
        $this.val(null);
        alert('您选择的图片已达上限!');
        return false;
      }
      $.each(this.files, function() {
        var $file = $('<li><a href="#"><img></a></li>');
        var reader  = new FileReader();
        reader.addEventListener('load', function() {
          $file.find('img').attr('src', reader.result);
        }, false);
        $file.data('data', this);
        $list.append($file);
        reader.readAsDataURL(this);
      });
      if($list.find('> li').length == 9) {
        $image_box.find('.add-image').addClass('hidden');
      }
    });

    $('.message').on('click', '.image-box > ul a', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var $item = $(this).closest('li');
      var $image_box = $item.closest('.image-box');
      var $add_button = $image_box.find('.add-image');
      $item.remove();
      $add_button.removeClass('hidden');
    });

    $(document).on('click', function(e) {
      var $imgbox = $(e.target).closest('.image-box');
      var $imgbtn = $(e.target).closest('.comment-box__image-btn');
      if(!$imgbox.length && !$imgbtn.length) {
        $('.message__item .image-box.show').removeClass('show');
      }
    });
  }

  function init_comment_input() {
    var lastWhich;
    $('.message').on('keypress', 'textarea', function(e) {
      if(e.which == 13 || e.which == 10 && e.ctrlKey) { // Enter / Ctrl + Enter
        e.preventDefault();
        var content = $.trim($(this).val());
        if(content != '') {
          // TODO
        }
      }
    });

    $('.message').on('keydown', 'textarea', function(e) {
      if(e.which == 8) { // Backspace
        if($(this).val() == '') {
          e.preventDefault();
          if(lastWhich != e.which) {
            var $message_item = $(this).closest('.message__item');
            hide_reply_quote($message_item);
          }
        }
      }
      lastWhich = e.which;
      var $this = $(this);
      var paddingBottom = parseInt($this.css('paddingBottom'));
      var paddingTop = parseInt($this.css('paddingTop'));
      $(this).height(0).height(this.scrollHeight - paddingBottom - paddingTop);
    });

    $('.message').on('keyup', 'textarea', function(e) {
      lastWhich = null;
    });
  }

  function init_reply_button() {
    $('.message').on('click', '.comment-box__item-toolbox .reply-link', function(e) {
      e.preventDefault();
      var $comment_item = $(this).closest('.comment-box__item');
      var $message_item = $comment_item.closest('.message__item');
      var $inputbox = $message_item.find('.comment-box__form .input-wrapper');
      var $content = $comment_item.find('.comment-box__item-content').clone();
      var replyto = $.trim($comment_item.find('> .media-left').text());
      $content.find('img').replaceWith('[图片]');
      $content.find('table').replaceWith('[表格]');
      var content = $content.text();
      $inputbox.find('.reply-quote').attr('data-label', replyto ? replyto + '：' : '').text(content);
      $inputbox.addClass('with-reply-quote');
      $inputbox.find('textarea').attr('placeholder', replyto ? '回复' + replyto : '').select();
    });

    $('.message').on('click', '.with-reply-quote .close', function(e) {
      e.preventDefault();
      var $message_item = $(this).closest('.message__item');
      hide_reply_quote($message_item);
    });
  }

  function init_comment_paging() {
    $('.message').on('split-page:success', '.message__item .comment-box', function(event, data) {
      var $container = $(this).find('.comment-box__list').empty();
      if(!data.object.length) {
        $container.append('<li class="text-center text-muted">暂无评论</li>');
        return;
      }
      $container.append($.map(data.object, function(val, i) {
        var params = $.extend({}, options.defaults.comment, options.comment.translate(val));
        var html = tpl_comment.render(params);
        return html;
      }));
    }).on('split-page:error', '.message__item .comment-box', function(event) {
      var $container = $(this).find('.comment-box__list').empty();
      $container.append('<li class="text-center text-muted">加载失败 请稍候再试</li>');
    }).on('click', '.comment-box__show-more', function(event) {
      event.preventDefault();
      var $comment_box = $(this).blur().closest('.comment-box').addClass('with-pagination');
      var initial_comments = $comment_box.data('initial-comments');
      if(!initial_comments) {
        $comment_box.data('initial_comments', $comment_box.find('.comment-box__list').html());
      }
      // TODO
      var settings = options.comment.load;
      var payload = $.extend({}, settings.data, {
        msgid: $comment_box.closest('.message__item').attr('data-id')
      });
      $comment_box.splitpage({
        url: settings.url,
        type: settings.method,
        contentType: 'application/json'
      }, payload);
    }).on('click', '.comment-box__show-less', function(event) {
      event.preventDefault();
      var $comment_box = $(this).blur().closest('.comment-box').removeClass('with-pagination');
      $comment_box.find('.comment-box__list').html($comment_box.data('initial_comments'));
      // TODO
      $comment_box.splitpage('destroy');
    });
  }

  function hide_reply_quote(message_item) {
    var $message_item = $(message_item);
    var $inputbox = $message_item.find('.comment-box__form .input-wrapper');
    if($inputbox.hasClass('with-reply-quote')) {
      var $heading = $message_item.find('.media-heading').clone();
      $heading.find('small').remove();
      $inputbox.removeClass('with-reply-quote');
      $inputbox.find('textarea').attr('placeholder', '回复' + $heading.text()).focus();
      // TODO
    }
  }

  function translate_object(data, map, defaults) {
    var result = $.extend({}, defaults, data);
    $.each(map, function _translate(key, value, object) {
      if(!object) {
        object = result;
      }
      if(typeof value == 'function') {
        object[key] = value.call(null, object);
      } else if(typeof value == 'string') {
        if(value) {
          object[key] = access_object_by_path(object, value);
        } else {
          object[key] = '';
        }
        if(object[key] === undefined) {
          object[key] = value;
        }
      } else if($.isPlainObject(value)) {
        for(var _k in value) {
          if(!value.hasOwnProperty(_k)) continue;
          if(!object[key]) object[key] = {};
          _translate(_k, value[_k], object[key]);
        }
      } else {
        object[key] = value;
      }
    });
    return result;
  }

  function request(method, url, enctype, data, callback, errhandler) {
    if(method.toUpperCase() != 'GET' && enctype == 'application/json' && $.isPlainObject(data)) {
      data = JSON.stringify(data);
    }
    $.ajax({
      url: url,
      type: method,
      contentType: enctype,
      dataType: 'json',
      data: data,
      complete: function(jqXHR, textStatus) {
        if(jqXHR.status != 200 || jqXHR.responseJSON && jqXHR.responseJSON.code != '200') {
          // TODO: advanced error handling
          var error = jqXHR.responseJSON || jqXHR.responseXML || jqXHR.responseText;
          if(typeof error == 'string') {
            try {
              error = JSON.parse(error);
            } catch(e) {}
          }
          console.error(error);
          if(errhandler) {
            errhandler.call(this, error, jqXHR, textStatus);
          }
        }
      },
      success: function(data, textStatus, jqXHR) {
        if(jqXHR.status != 200 || data.code != '200') return;
        callback.apply(this, arguments);
      }
    });
  }

  return {
    init: function(settings) {
      $.extend(true, options, settings);
      init_message_load_more();
      init_acknowledge_button();
      init_collapse_button();
      init_reply_button();
      init_image_box();
      init_comment_input();
      init_comment_paging();
    }
  };

})(this.jQuery);
