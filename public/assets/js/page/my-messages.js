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
      init_image_box();
    }
  };

})(this.jQuery);
