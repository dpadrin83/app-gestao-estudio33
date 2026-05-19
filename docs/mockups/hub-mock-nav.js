(function () {
  var views = document.querySelectorAll(".mock-view");
  var toast = document.getElementById("mock-toast");

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  function setActiveNav(el) {
    document.querySelectorAll(".sidebar .nav-item").forEach(function (n) {
      n.classList.remove("active");
    });
    if (el) el.classList.add("active");
  }

  function showView(id, scrollTarget) {
    views.forEach(function (v) {
      v.classList.remove("active");
    });
    var view = document.getElementById("view-" + id);
    if (view) view.classList.add("active");
    if (scrollTarget) {
      requestAnimationFrame(function () {
        var el = document.getElementById(scrollTarget);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  document.querySelectorAll("[data-nav]").forEach(function (item) {
    item.addEventListener("click", function (e) {
      var nav = item.getAttribute("data-nav");
      if (!nav) return;
      e.preventDefault();
      var navEl = item.classList.contains("nav-item")
        ? item
        : item.closest(".nav-item");
      if (navEl) setActiveNav(navEl);
      if (nav === "projetos") {
        showView("dashboard", "projetos-ativos");
        showToast("Projetos ativos no dashboard");
        return;
      }
      if (nav === "financeiro") {
        showView("dashboard");
        var fin = document.querySelector(".row2-faturamento");
        if (fin) fin.scrollIntoView({ behavior: "smooth", block: "center" });
        showToast("Card de faturamento no dashboard");
        return;
      }
      showView(nav);
    });
  });
})();
