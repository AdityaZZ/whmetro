var MyMessages = (function($) {

  'use strict';

  var options;
  var defaults = {
    messages: {
      url: '',
      size: 5
    }
  };

  function get_messages(start, size, callback) {
    if(!callback) {
      callback = size;
    }
    request('GET', options.messages.url, {
      start: start,
      size: size || options.messages.size
    }, function(data) {
      // TODO: render newly fetched messages
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
      // TODO
      request('POST', '/message/acknowledge', {
        id: $msg_item.data('id')
      }, function(data) {
        $ack_btn.addClass('hidden');
        $msg_item.removeClass('notice');
      });
    });
  }

  function init_image_box() {
    $('.message').on('click', '.comment-box__image-btn', function(e) {
      var $img_btn = $(this);
      var $msg_item = $img_btn.closest('.message__item');
      var $img_box = $msg_item.find('.image-box');
      $img_box.toggleClass('show');
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

  function request(method, url, data, callback) {
    if($.isPlainObject(data)) {
      data = JSON.stringify(data);
    }
    $.ajax({
      url: url,
      type: method,
      contentType: 'application/json',
      dataType: 'json',
      data: data,
      complete: function(jqXHR, textStatus) {
        if(jqXHR.status != 200) {
          // TODO: advanced error handling
          var error = jqXHR.responseText;
          if(typeof error == 'string') {
            try {
              error = JSON.parse(error);
            } catch(e) {}
          }
          console.error(error);
        }
      },
      success: function(data, textStatus, jqXHR) {
        if(jqXHR.status != 200) return;
        callback.apply(this, arguments);
      }
    });
  }

  return {
    init: function(type) {
      init_acknowledge_button();
      init_reply_button();
      init_image_box();
      init_comment_input();
    }
  };

})(this.jQuery);
