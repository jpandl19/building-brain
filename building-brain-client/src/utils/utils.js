import jwtDecode from 'jwt-decode'

export const getRolesFromToken = (token) => {
    const payload = jwtDecode(token);
    const namespace = 'https://servicegpt.app';
    return payload[`${namespace}/roles`];
}

export const checkRoles = (userRoles, requiredRoles) => {
    const missingRoles = requiredRoles.filter(role => !userRoles.includes(role));

    if (missingRoles.length > 0) {
        throw new Error(`Missing required roles: ${missingRoles.join(', ')}`);
    }
}


export const extractPlatformId = (url) => {
  const urlObj = new URL(url);
  const queryParams = new URLSearchParams(urlObj.search);
  let platformId = queryParams.get('platformId');

  // lets also check, are we at the buildingbrain domain?
  if (url.includes(`buildingbrain`)) {
    platformId = 0;
  }

    // lets also check, are we at the buildingbrain domain?
    if (url.includes(`building-brain`)) {
      platformId = 0;
    }

  console.log(`Returning platformId: ${platformId}`)
  return platformId || 0;
}

export const changeFaviconAndTitle = (image, title) => {
  // first, change the title
  document.title = title;

  // next, create a new link element for the favicon
  let link = document.createElement('link');
  let oldLink = document.getElementById('dynamic-favicon');
  link.id = 'dynamic-favicon';
  link.rel = 'shortcut icon';
  link.type = 'image/x-icon';
  // resize image to favicon size (usually 16x16 or 32x32)
  let canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  let context = canvas.getContext('2d');

  // create new image and handle onload and onerror
  let img = new Image();
  img.onload = function () {
    // once image is loaded, draw it on the canvas
    context.drawImage(this, 0, 0, 128, 128);

    // use toDataURL to get the base64 representation
    let resizedImageUrl = canvas.toDataURL('image/x-icon');
    // set the new favicon
    link.href = resizedImageUrl;

    // replace the old favicon with the new one, or add it if it doesn't exist
    oldLink.remove()
    document.head.appendChild(link);
  };
  img.onerror = function () {
    console.error('Could not load image at ' + image + '. Unable to update favicon.');
  };
  img.src = image;
}