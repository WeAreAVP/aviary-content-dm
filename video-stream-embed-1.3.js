(function() {
'use strict';

  let currentInstance = null;

  function VimeoAPI(url) {
    return new Promise(function(resolve) {
      if (!url) {
        return resolve(false);
      }
      // create iframe for youtube
      let html = '<iframe src="' + url + '" class="embed-responsive-item" allowfullscreen></iframe>';
      resolve(html);
    });
  }

  function VimeoNonAPI(url) {
    return new Promise(function(resolve) {
      if (!url) {
        return resolve(false);
      }

      if (!url.match(/player/)) {
           url = url.replace('https://vimeo.com', 'https://player.vimeo.com/video');
      }

      // create iframe for youtube
      let html = '<iframe src="' + url + '" class="embed-responsive-item" allowfullscreen></iframe>';
      resolve(html);
    });
  }

  function YoutubeAPI(url) {
    return new Promise(function(resolve) {
      if (!url) {
        return resolve(false);
      }
      url = url.replace('watch?v=', 'embed/');
      // create iframe for youtube
      let html = '<iframe type="text/html" src="' + url + '" class="embed-responsive-item" allowfullscreen=""></iframe>';
      resolve(html);
    });
  }

  function KalturaAPI(url) {
    return new Promise(function(resolve) {
      if (!url) {
        return resolve(false);
      }
      // create iframe for kaltura
      let html = '<div class="videoWrapper"><iframe src="' + url + '" class="embed-responsive-item" allowfullscreen ></iframe></div>';
      resolve(html);
    });
  }

  function YoutuAPI(url) {
    if (!url) {
      return resolve(false);
    }
    url = url.replace('youtu.be/', 'youtube.com/watch?v=');
    return YoutubeAPI(url);
  }
  function AviaryAPI(url) {

    return new Promise(function (resolve) {
      if (!url) {
        return resolve(false);
      }
      try {
        document.getElementsByClassName('ItemTitle-primaryTitle')[0].style.display = 'none';
        // document.getElementsByClassName('ItemView-mainColumn')[0].style.display='none';
        document.getElementsByClassName('ItemView-sideColumn')[1].style.display='none';
        // document.getElementsByClassName('ItemView-mainColumn')[0].style.width='100%';
        document.getElementsByClassName('ItemView-mainColumn')[1].style.width='100%';
        document.getElementsByClassName('CoreLayout-headerContainer')[0].style.position = 'absolute';
      }
      catch(err) {
        console.log('Failed to style.')
      }

      let uri = new URL(url);
      let querySeperator = uri.search === '' ? '?' : '&'
      let stringParams = querySeperator + 'embed=true';
      url = url + stringParams;
      // create iframe for aviary embed
      let html = '<iframe src="' + url + '" class="embed-responsive-item" allowfullscreen></iframe>';
      resolve(html);
    });
  }
  const APIS = {
    'player.vimeo.com': VimeoAPI,
    'vimeo.com': VimeoNonAPI,
    'youtu.be': YoutuAPI,
    'www.youtube.com': YoutubeAPI,
    'cdnapisec.kaltura.com': KalturaAPI,
    'aviaryplatform.com': AviaryAPI,
  };

  function loadFrame(link) {
    return Promise.resolve(link).then(function (link) {
      let url = new URL(link);
      let loader;
      // find proper api from api list
      if (/aviaryplatform.com/i.test(link)) {
        loader = APIS['aviaryplatform.com'];
      } else {
        loader = APIS[url.hostname];
      }
      return loader && loader(link);
    }).catch(console.warn);
  }

  function CustomVideoView(container) {
    if (!container) {
      return false;
    }
    const anchor = container.querySelector('a');
    if (!anchor || !/player.vimeo.com|vimeo.com|aviaryplatform.com|youtube.com|youtu.be|cdnapisec.kaltura.com/i.test(anchor.href)) {
      return false;
    }

    let links = [anchor.href];
    // parse metadata
    const rows = document.querySelectorAll('tr[class*=metadatarow]');
    Array.from(rows).forEach(function(row) {
      // find a description field
      if (row.firstChild.textContent === 'Description') {
        links = links.concat(row.lastChild.textContent.split(','));
      }
    });

    // create container for iFrames
    const frameContainer = document.createElement('div');
    frameContainer.classList.add('embed-responsive', 'embed-responsive-16by9');

    const mount = function() {
      const reqs = links.map(function(link) {
        return loadFrame(link);
      });

      Promise.all(reqs).then(function(reps) {
        // hide original viewer
        container.className += ' hide';
        document.querySelector('div.preview').style.display = 'block';
        // add each frames to one root
        reps.forEach(function(embeddedHTML) {
          embeddedHTML && (frameContainer.innerHTML += embeddedHTML);
        });
        // insert it
        container.parentNode.insertBefore(frameContainer, container);
      });
    };

    const unmount = function() {
      frameContainer.parentNode && frameContainer.parentNode.removeChild(frameContainer);
    };

    mount();

    return {unmount: unmount};

  }

  let globalScope = true;
  let collectionScope = [
    'p15700coll2'
  ];

  document.addEventListener('cdm-item-page:ready', function(e) {
    const collection = e.detail.collectionId;
    if (globalScope || collectionScope.includes(collection)) {
      // unmount or remove current video player from DOM if it is exists
      currentInstance && currentInstance.unmount();
      // creates a new instance if it is url item and it is from vimeo.com
      currentInstance = CustomVideoView(document.querySelector('div[class*=itemUrl]'));
    }
  });

  document.addEventListener('cdm-item-page:update', function(e) {
    const collection = e.detail.collectionId;
    if (globalScope || collectionScope.includes(collection)) {
      currentInstance && currentInstance.unmount();
      // updates an instance if it is url item and it is from vimeo.com
      currentInstance = CustomVideoView(document.querySelector('div[class*=itemUrl]'));
    }
  });

  document.addEventListener('cdm-item-page:leave', function(e) {
    const collection = e.detail.collectionId;
    if (globalScope || collectionScope.includes(collection)) {
      // unmount or remove current video player from DOM if it is exists
      currentInstance && currentInstance.unmount();
    }
  });

})();

/* version history

1.3 - 2025 March 11 - Added aviaryplatform.com embed support
1.2 - 2019 October 2 - corrected errant apostrophe typo with VimeoNonAPI
1.1 - 2019 August 9 - add non-embeddable Vimeo URLs; add global/collection toggle
1.0 - 2018 June - initial implementation

*/
