(function () {
  var path = window.location.pathname;

  if (!path.endsWith("/")) {
    var last = path.split("/").pop() || "";

    if (last.indexOf(".") !== -1) {
      path = path.slice(0, path.lastIndexOf("/") + 1);
    } else {
      path += "/";
    }
  }

  var base = document.createElement("base");
  base.href = path;
  document.head.appendChild(base);
})();
