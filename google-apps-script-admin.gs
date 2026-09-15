/*
 * Deploy this file as the Google Apps Script web app behind SCRIPT_URL.
 * Keep the deployment's execute-as setting set to the sheet owner and do not
 * make the spreadsheet itself publicly readable.
 */
var ADMIN_TOKEN_TTL_SECONDS = 60 * 30;

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAdminPost(e) {
  var action = String((e.parameter || {}).action || '');
  if (action !== 'adminLogin' && action !== 'getOrders' && action !== 'markPaymentDone') return null;

  if (action === 'adminLogin') {
    var username = String(e.parameter.username || '').trim();
    var password = String(e.parameter.password || '');
    var auth = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Authentication');
    if (!auth) return jsonResponse_({ success: false, message: 'Authentication is not configured.' });
    var credentials = auth.getRange(1, 1, auth.getLastRow(), 2).getDisplayValues();
    var valid = credentials.some(function (row) {
      return row[0] === username && row[1] === password;
    });
    if (!valid) return jsonResponse_({ success: false, message: 'Invalid username or password.' });

    var token = Utilities.getUuid();
    CacheService.getScriptCache().put('admin:' + token, username, ADMIN_TOKEN_TTL_SECONDS);
    return jsonResponse_({ success: true, token: token });
  }

  var token = String(e.parameter.token || '');
  if (!CacheService.getScriptCache().get('admin:' + token)) {
    return jsonResponse_({ success: false, message: 'Your session has expired. Please log in again.' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  if (!sheet) return jsonResponse_({ success: false, message: 'Sheet1 was not found.' });
  if (action === 'markPaymentDone') {
    var orderId = String(e.parameter.orderId || '');
    if (!orderId) return jsonResponse_({ success: false, message: 'Order ID is required.' });
    if (sheet.getLastRow() < 2) return jsonResponse_({ success: false, message: 'Order not found.' });
    var orderIds = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 1), 1).getDisplayValues();
    for (var rowIndex = 0; rowIndex < orderIds.length; rowIndex++) {
      if (orderIds[rowIndex][0] === orderId) {
        sheet.getRange(rowIndex + 2, 10).setValue('Payment Done');
        return jsonResponse_({ success: true });
      }
    }
    return jsonResponse_({ success: false, message: 'Order not found.' });
  }
  if (sheet.getLastRow() < 2) return jsonResponse_({ success: true, orders: [] });
  var values = sheet.getDataRange().getDisplayValues();
  var headers = values.shift().map(function (header) {
    return String(header).toLowerCase().replace(/[^a-z0-9]/g, '');
  });
  var aliases = {
    orderid: ['orderid'], noofmodaks: ['noofmodaks', 'numberofmodaks'],
    modakprice: ['modakprice', 'totalprice'], roomno: ['roomno'],
    towername: ['towername', 'tower'], personname: ['personname', 'name'],
    contactno: ['contactno', 'contactnumber'], emailid: ['emailid', 'email'],
    expectedDateTime: ['expecteddatetime', 'expecteddateandtime', 'deliverydatetime'],
    timestamp: ['timestamp', 'ordertime'], paymentmode: ['paymentmode'],
    paymentstatus: ['paymentstatus']
  };
  var indexFor = function (name) {
    var matches = aliases[name] || [name];
    for (var i = 0; i < matches.length; i++) {
      var position = headers.indexOf(matches[i]);
      if (position !== -1) return position;
    }
    return -1;
  };
  return jsonResponse_({
    success: true,
    orders: values.map(function (row) {
      var order = {};
      Object.keys(aliases).forEach(function (key) {
        var index = indexFor(key);
        order[key] = index === -1 ? '' : row[index];
      });
      return order;
    }).reverse()
  });
}

function getNextOrderId_(sheet) {
  // Column B is the source of truth. No sequence is stored outside the sheet.
  if (sheet.getLastRow() < 2) return 1;
  var ids = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (var index = ids.length - 1; index >= 0; index--) {
    var rawOrderId = String(ids[index][0]).trim();
    if (!rawOrderId) continue;
    var lastOrderId = Number(rawOrderId);
    if (Number.isFinite(lastOrderId) && lastOrderId >= 0) {
      return Math.floor(lastOrderId) + 1;
    }
  }

  // There are no order IDs left in the sheet, so restart the sequence.
  return 1;
}

function doPost(e) {
  try {
    var adminResponse = handleAdminPost(e);
    if (adminResponse) return adminResponse;

    if ((e.parameter || {}).action) {
      return jsonResponse_({ success: false, message: 'Unsupported admin action.' });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    if (!sheet) return jsonResponse_({ success: false, message: 'Sheet1 was not found.' });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var orderId = String(getNextOrderId_(sheet));
      var noofModaks = e.parameter.noofModaks || '0';
      var modakPrice = Number(noofModaks) * 35;
      if (!sheet.getRange(1, 11).getValue()) {
        sheet.getRange(1, 11).setValue('Expected Date and Time');
      }

      sheet.appendRow([
        new Date(), orderId, noofModaks, modakPrice,
        e.parameter.roomNo || '', e.parameter.towerName || '',
        e.parameter.personName || '', e.parameter.contactNo || '',
        e.parameter.emailId || '', 'Pending', e.parameter.expectedDateTime || ''
      ]);

      return jsonResponse_({ success: true, orderId: orderId });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return jsonResponse_({ success: false, message: String(error) });
  }
}
