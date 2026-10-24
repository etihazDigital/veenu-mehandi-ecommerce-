(function () {
  var VM = window.VM, S = window.STORE;
  var root = document.getElementById("checkout-root");
  var STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
    "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

  /* ---------- order helpers ---------- */
  function orderId() {
    var d = new Date(), c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = "";
    for (var i = 0; i < 4; i++) r += c.charAt(Math.floor(Math.random() * c.length));
    var yy = String(d.getFullYear()).slice(2), mm = ("0" + (d.getMonth() + 1)).slice(-2), dd = ("0" + d.getDate()).slice(-2);
    return "VM-" + yy + mm + dd + "-" + r;
  }
  function itemsText(o) {
    return o.items.map(function (i) { return "- " + i.name + " x " + i.qty + " = Rs " + i.total; }).join("\n");
  }
  function whatsappText(o) {
    return "Hello " + S.name + "! I have placed order " + o.id + ".\n\n" + itemsText(o) +
      "\n\nSubtotal: Rs " + o.subtotal + "\nShipping (" + o.kg + " kg): Rs " + o.shipping + "\nTotal: Rs " + o.total +
      "\n\nName: " + o.name + "\nPhone: " + o.phone + "\nAddress: " + o.address + ", " + o.city + ", " + o.state + " - " + o.pin +
      (o.notes ? "\nNote: " + o.notes : "") + "\n\nI am paying by UPI. Sending the payment screenshot here.";
  }
  function sendEmail(o) {
    if (!S.orderEmailEndpoint || !window.fetch) return Promise.resolve(false);
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
    var body = {
      _subject: "New order " + o.id + " - Rs " + o.total, _template: "table", _captcha: "false",
      "Order ID": o.id, Name: o.name, Phone: o.phone, Items: itemsText(o),
      Subtotal: "Rs " + o.subtotal, Shipping: "Rs " + o.shipping + " (" + o.kg + " kg)", Total: "Rs " + o.total,
      Address: o.address + ", " + o.city + ", " + o.state + " - " + o.pin, Notes: o.notes || "-"
    };
    if (o.email) body.email = o.email;
    return fetch(S.orderEmailEndpoint, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined
    }).then(function (r) { clearTimeout(timer); return r.ok; }).catch(function () { clearTimeout(timer); return false; });
  }

  /* ---------- views ---------- */
  function emptyView() {
    root.innerHTML = '<div class="empty"><h3>Your cart is empty</h3><p>Add products to your cart before checking out.</p><a class="btn" href="shop.html">Start shopping</a></div>';
  }

  function formView(lines) {
    var t = VM.totals(lines);
    var mini = lines.map(function (l) {
      return '<div class="mini-line"><span>' + VM.esc(VM.lineName(l)) + " × " + l.qty + "</span><span>" + VM.money(l.total) + "</span></div>";
    }).join("");
    var opts = '<option value="">Select state</option>' + STATES.map(function (s) { return "<option>" + s + "</option>"; }).join("");

    root.innerHTML = '<div class="cart-wrap"><form class="panel" id="co-form" novalidate><h2>Delivery details</h2>' +
      '<div class="form-grid">' +
      '<div class="f"><label for="name">Full name</label><input class="field" id="name" autocomplete="name"><div class="err"></div></div>' +
      '<div class="f"><label for="phone">Mobile number</label><input class="field" id="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit number"><div class="err"></div></div>' +
      '<div class="f span2"><label for="email">Email <i>(optional)</i></label><input class="field" id="email" type="email" autocomplete="email"><div class="err"></div></div>' +
      '<div class="f span2"><label for="address">Full address</label><textarea class="field" id="address" rows="2" autocomplete="street-address" placeholder="House no., street, area, landmark"></textarea><div class="err"></div></div>' +
      '<div class="f"><label for="city">City</label><input class="field" id="city" autocomplete="address-level2"><div class="err"></div></div>' +
      '<div class="f"><label for="state">State</label><select class="field" id="state">' + opts + '</select><div class="err"></div></div>' +
      '<div class="f"><label for="pin">PIN code</label><input class="field" id="pin" inputmode="numeric" maxlength="6" autocomplete="postal-code"><div class="err"></div></div>' +
      '<div class="f"><label for="notes">Note <i>(optional)</i></label><input class="field" id="notes" placeholder="Anything we should know?"></div>' +
      "</div>" +
      '<button class="btn btn-block" id="place" type="submit" style="margin-top:22px">Place order</button>' +
      '<p class="muted" style="font-size:.88rem;margin:12px 0 0">Next you will see the UPI payment details. Your order is confirmed once payment is received.</p></form>' +
      '<aside class="summary"><h3>Your order</h3>' + mini +
      '<div class="sum-row" style="margin-top:8px"><span>Subtotal</span><span>' + VM.money(t.subtotal) + "</span></div>" +
      '<div class="sum-row"><span>Shipping<small>' + t.kg + " kg × " + VM.money(S.shippingPerKg) + "</small></span><span>" + VM.money(t.shipping) + "</span></div>" +
      '<div class="sum-row sum-total"><span>Total</span><span>' + VM.money(t.total) + '</span></div><p class="fine"><a href="cart.html">Edit cart</a></p></aside></div>';

    var form = document.getElementById("co-form");
    function val(id) { return document.getElementById(id).value.trim(); }
    function setErr(id, msg) {
      var el = document.getElementById(id), box = el.parentNode.querySelector(".err");
      el.classList.toggle("bad", !!msg); if (box) box.textContent = msg || "";
      return !msg;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var phone = val("phone").replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
      var ok = true, first = null;
      function chk(id, msg) { var good = setErr(id, msg); if (!good && !first) first = id; ok = ok && good; }
      chk("name", val("name").length < 2 ? "Please enter your name" : "");
      chk("phone", /^[6-9]\d{9}$/.test(phone) ? "" : "Enter a valid 10-digit mobile number");
      chk("email", val("email") && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("email")) ? "Enter a valid email" : "");
      chk("address", val("address").length < 8 ? "Please enter your full address" : "");
      chk("city", val("city").length < 2 ? "Please enter your city" : "");
      chk("state", val("state") ? "" : "Please select your state");
      chk("pin", /^\d{6}$/.test(val("pin")) ? "" : "Enter a 6-digit PIN code");
      if (!ok) { document.getElementById(first).focus(); return; }

      var btn = document.getElementById("place");
      btn.disabled = true; btn.textContent = "Placing order...";
      var tt = VM.totals(VM.cart.lines());
      var order = {
        id: orderId(), name: val("name"), phone: phone, email: val("email"), address: val("address"),
        city: val("city"), state: val("state"), pin: val("pin"), notes: val("notes"),
        items: VM.cart.lines().map(function (l) { return { name: VM.lineName(l), qty: l.qty, total: l.total }; }),
        subtotal: tt.subtotal, shipping: tt.shipping, kg: tt.kg, total: tt.total
      };
      try { sessionStorage.setItem("vm_last_order", JSON.stringify(order)); } catch (err) { /* ignore */ }
      sendEmail(order).then(function () {
        VM.cart.clear();
        doneView(order);
        window.scrollTo(0, 0);
      });
    });
  }

  function doneView(o) {
    var upi = S.upiId;
    var upiLink = upi ? "upi://pay?pa=" + encodeURIComponent(upi) + "&pn=" + encodeURIComponent(S.upiName) +
      "&am=" + o.total + "&cu=INR&tn=" + encodeURIComponent(o.id) : "";
    var payHtml;
    if (upi) {
      payHtml = '<p>Pay <b>' + VM.money(o.total) + '</b> to this UPI ID:</p>' +
        '<div class="upi-id"><span id="upi-text"></span><button class="btn btn-sm btn-ghost" type="button" id="copy">Copy</button></div>' +
        '<a class="btn" id="upi-open" href="' + upiLink + '">Open UPI app</a>' +
        '<div id="qr" class="qr" aria-label="UPI QR code"></div>' +
        '<p class="muted" style="font-size:.85rem;margin:10px 0 0">On a computer, scan the QR code with any UPI app on your phone. The amount is filled in for you.</p>';
    } else {
      payHtml = "<p>Send us a message on WhatsApp and we will share the UPI payment details for <b>" + VM.money(o.total) + "</b>.</p>";
    }
    root.innerHTML = '<div class="panel" style="max-width:760px;margin:30px auto 60px"><div class="big-ok">✓</div>' +
      "<h2>Thank you, <span id=\"nm\"></span>!</h2>" +
      "<p>Your order <b>" + VM.esc(o.id) + "</b> has been placed. Total to pay: <b>" + VM.money(o.total) + "</b> (including " + VM.money(o.shipping) + " shipping).</p>" +
      '<div class="pay-box"><div class="pay-step" data-n="1"><h3>Pay by UPI</h3>' + payHtml + "</div>" +
      '<div class="pay-step" data-n="2"><h3>Send us the payment screenshot</h3><p>Tap the button to send your order details on WhatsApp, then attach your payment screenshot.</p>' +
      '<a class="btn btn-wa" id="wa-send" target="_blank" rel="noopener" href="' + VM.waLink(whatsappText(o)) + '">Send order on WhatsApp</a></div>' +
      '<div class="pay-step" data-n="3"><h3>We dispatch your order</h3><p>Once payment is confirmed, your order is dispatched within ' + S.dispatchHours + ' hours. We will share tracking details on WhatsApp.</p></div></div>' +
      '<a class="btn btn-ghost" href="shop.html">Continue shopping</a></div>';
    document.getElementById("nm").textContent = o.name.split(" ")[0];
    if (upi) {
      try {
        var qr = qrcode(0, "M"); qr.addData(upiLink); qr.make();
        document.getElementById("qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      } catch (err) { var q = document.getElementById("qr"); if (q) q.remove(); }
      document.getElementById("upi-text").textContent = upi;
      document.getElementById("copy").addEventListener("click", function () {
        var done = function () { VM.toast("UPI ID copied"); };
        if (navigator.clipboard) navigator.clipboard.writeText(upi).then(done, done); else done();
      });
    }
  }

  /* ---------- start ---------- */
  var lines = VM.cart.lines();
  if (lines.length) formView(lines);
  else {
    var last = null;
    try { last = JSON.parse(sessionStorage.getItem("vm_last_order")); } catch (e) { /* ignore */ }
    if (last && last.id) doneView(last); else emptyView();
  }
})();
