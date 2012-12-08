/*
 * $z.attach
 * Used for attaching components as if they were generated client-side after a server render.
 *
 * Simply render the expected HTML and place the following around the component:
 *
 * <!-- ensure css is loaded -->
 * <script src='require-inline.js' data-require='css!app/slideshow,css!app/slideshow,css!app/slideshow'></script>
 *
 * <!-- display html -->
 * <template html here>
 *
 * <!-- ensure module is loaded for immediate attachment -->
 * <script src='require-inline.js' data-require='zest,app/slideshow'></script>
 *
 * <!-- apply the attachment script -->
 * <script src='zest/attach.js' data-zid='zid' data-controllerid='app/slideshow' data-options='{optionsJSON}'></script>
 *
 * It relies on the fact that the component has the right id to detect its elements as the previous siblings until it reaches
 * the primary component element with the right id on it.
 *
 * If no controller is given, the component is simply registered as a static component.
 *
 * Finally, also ensure that there is a sync require to zest at the top of the page.
 * 
 */

// make volo think this is an amd module
if (false) define({});

(function() {
  // get the script tag for this script
  var scriptTag = Array.prototype.pop.call(document.getElementsByTagName('script'));
  
  var zid = scriptTag.getAttribute('data-zid');
  
  if (zid == null)
    return;
  
  var controllerId = scriptTag.getAttribute('data-controllerid');
  
  var options = scriptTag.getAttribute('data-options');
  
  if (options) {
    options = JSON.parse(options);
    options.global = $z._global;
  }
    
  // find attach element
  var el = document.getElementById(zid);
  
  if (!el)
    throw 'No component with id ' + zid + ' found for attachment!';
  
  // main component HTML elements
  //var els = [curElement];
  
  // step down through siblings until we find this script
  //while (curElement != scriptTag && (curElement = curElement.nextSibling))
  //  els.push(curElement);
  
  //if (curElement != scriptTag)
  //  throw 'Unable to detect component template for ' + zid + '. Malformed HTML.';
  
  var requireInlineUrl = require.toUrl('require-inline');
  
  // require zest and the component id to do the enhancements
  require(['zest', controllerId, 'json/json'], function($z, controllerFunction, JSON) {
    if ($z._nextComponentId <= zid.substr(1))
      $z._nextComponentId = parseInt(zid.substr(1)) + 1;
    
    var attach = controllerFunction.attach ? controllerFunction.attach : controllerFunction;
    
    var controller = attach.call(controllerFunction, el, options || { global: $z._global });

    $z._components[zid] = controller || el;

    if (!controller)
      return;

    var dispose = controller.dispose;

    if (dispose && $z.fn) {
      if (dispose.constructor == $z.fn)
        dispose.run = $z.fn.STOP_FIRST_DEFINED;
      else
        dispose = $z.fn([dispose], $z.fn.STOP_FIRST_DEFINED);
      dispose.first(function(system) {
        if (!system)
          return $z.dispose(el);
      })
    }
    else
      controller.dispose = function(system) {
        if (!system)
          return $z.dispose(el);
        if (dispose)
          dispose();
      }
  });
  
  // remove the attach script itself
  scriptTag.parentNode.removeChild(scriptTag);
})();
