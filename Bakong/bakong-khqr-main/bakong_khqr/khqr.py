# examples/run_demo.py
import os
import io
import csv
import json
import threading
import time
import tkinter as tk
from datetime import datetime
from decimal import Decimal, ROUND_DOWN

import requests
from PIL import Image, ImageTk, ImageDraw
from dotenv import load_dotenv


class KHQR:
    """Lightweight KHQR helper that composes EMV TLV pieces from the bundled sdk.

    This implementation is intentionally small and uses the sdk/* helpers
    to build the EMV payload, compute CRC, create an image and generate MD5.
    It provides the minimal interface expected by the demo below:
      - create_qr(...)
      - generate_md5(qr_string)
      - qr_image(qr_string, format="bytes")
      - check_payment(md5)
    """

    def __init__(self, bakong_token=None):
        self.bakong_token = bakong_token
        self._api_base = os.getenv("BAKONG_API_BASE", "https://api-bakong.nbc.gov.kh/v1").rstrip("/")

        # lazy-import SDK helpers (small runtime cost, better testability)
        # When the module is executed as a script (``python khqr.py``) relative
        # imports like ``from .sdk...`` will raise "attempted relative import
        # with no known parent package". Try relative imports first (package
        # usage), then fall back to absolute imports for script mode.
        try:
            from .sdk.payload_format_indicator import PayloadFormatIndicator
            from .sdk.point_of_initiation import PointOfInitiation
            from .sdk.global_unique_identifier import GlobalUniqueIdentifier
            from .sdk.merchant_name import MerchantName
            from .sdk.merchant_city import MerchantCity
            from .sdk.mcc import MCC
            from .sdk.transaction_currency import TransactionCurrency
            from .sdk.amount import Amount
            from .sdk.country_code import CountryCode
            from .sdk.additional_data_field import AdditionalDataField
            from .sdk.timestamp import TimeStamp
            from .sdk.crc import CRC
            from .sdk.hash import HASH
            from .sdk.image_tools import ImageTools
        except Exception:
            from bakong_khqr.sdk.payload_format_indicator import PayloadFormatIndicator
            from bakong_khqr.sdk.point_of_initiation import PointOfInitiation
            from bakong_khqr.sdk.global_unique_identifier import GlobalUniqueIdentifier
            from bakong_khqr.sdk.merchant_name import MerchantName
            from bakong_khqr.sdk.merchant_city import MerchantCity
            from bakong_khqr.sdk.mcc import MCC
            from bakong_khqr.sdk.transaction_currency import TransactionCurrency
            from bakong_khqr.sdk.amount import Amount
            from bakong_khqr.sdk.country_code import CountryCode
            from bakong_khqr.sdk.additional_data_field import AdditionalDataField
            from bakong_khqr.sdk.timestamp import TimeStamp
            from bakong_khqr.sdk.crc import CRC
            from bakong_khqr.sdk.hash import HASH
            from bakong_khqr.sdk.image_tools import ImageTools

        self._pfi = PayloadFormatIndicator()
        self._poi = PointOfInitiation()
        self._guid = GlobalUniqueIdentifier()
        self._mname = MerchantName()
        self._mcity = MerchantCity()
        self._mcc = MCC()
        self._txcur = TransactionCurrency()
        self._amount = Amount()
        self._cc = CountryCode()
        self._adf = AdditionalDataField()
        self._ts = TimeStamp()
        self._crc = CRC()
        self._hash = HASH()
        self._img = ImageTools()

    # ------------------- Bakong API helpers -------------------
    def _ensure_token(self):
        if not self.bakong_token:
            raise ValueError("BAKONG_TOKEN is required to poll transaction status. "
                             "Set it in the .env file before checking payments.")

    def _post_bakong(self, endpoint: str, payload):
        """
        Lightweight wrapper around requests.post for Bakong Open API.
        """
        self._ensure_token()
        url_path = endpoint.lstrip("/")
        url = f"{self._api_base}/{url_path}"

        headers = {
            "Authorization": f"Bearer {self.bakong_token}",
            "Content-Type": "application/json",
            "User-Agent": "khqr-demo/1.0 (+https://github.com/bsthen/bakong-khqr)",
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
        except requests.RequestException as exc:
            raise ConnectionError("Unable to contact Bakong Open API") from exc

        if response.status_code == 200:
            try:
                return response.json()
            except json.JSONDecodeError as exc:
                raise ValueError("Bakong API returned invalid JSON payload") from exc

        # Map common Bakong error codes into cleaner exceptions for callers.
        message = f"Bakong API returned HTTP {response.status_code}"
        try:
            error_payload = response.json()
            message_detail = error_payload.get("responseMessage") or error_payload.get("message")
            if message_detail:
                message = f"{message}: {message_detail}"
        except Exception:
            pass

        if response.status_code == 400:
            raise ValueError(f"{message}. Check the request payload.")
        if response.status_code == 401:
            raise PermissionError(f"{message}. Token invalid or expired.")
        if response.status_code == 403:
            raise PermissionError(f"{message}. Bakong API is accessible only from approved IP ranges.")
        if response.status_code == 404:
            raise ValueError(f"{message}. Endpoint not found.")
        if response.status_code in (429, 500, 504):
            raise RuntimeError(f"{message}. Please retry later.")

        raise RuntimeError(message)

    def create_qr(
        self,
        bank_account: str,
        merchant_name: str,
        merchant_city: str,
        amount,
        currency: str,
        store_label: str,
        phone_number: str,
        bill_number: str,
        terminal_label: str,
        static: bool = False,
    ) -> str:
        """Build the EMV TLV string and append CRC (final QR payload)."""
        parts = []
        parts.append(self._pfi.value())
        parts.append(self._poi.static() if static else self._poi.dynamic())
        parts.append(self._guid.value(bank_account))
        parts.append(self._mname.value(merchant_name))
        parts.append(self._mcity.value(merchant_city))
        parts.append(self._mcc.value())
        parts.append(self._txcur.value(currency))

        # amount is optional for static QR but allowed for dynamic
        if amount is not None:
            parts.append(self._amount.value(amount))

        parts.append(self._cc.value())

        # ensure optional strings are not None
        phone_number = phone_number or ""
        bill_number = bill_number or ""
        store_label = store_label or ""
        terminal_label = terminal_label or ""

        parts.append(self._adf.value(store_label, phone_number, bill_number, terminal_label))
        parts.append(self._ts.value())

        payload = "".join(parts)
        payload = payload + self._crc.value(payload)
        return payload

    def generate_md5(self, qr_string: str) -> str:
        return self._hash.md5(qr_string)

    def qr_image(self, qr_string: str, format: str = "bytes") -> bytes:
        """Return PNG image bytes for the given EMV payload.

        Currently this always returns raw PNG bytes (the demo expects bytes).
        """
        result = self._img.generate(qr_string)
        return result.to_bytes()

    def check_payment(self, md5: str) -> str:
        """Check payment status for the given MD5 hash using Bakong Open API."""
        md5_value = (md5 or "").strip()
        if not md5_value:
            raise ValueError("A valid MD5 hash is required to check payment status.")

        # Allow local testing without hitting the real API.
        if self.bakong_token == "simulate_paid":
            return "PAID"

        response = self._post_bakong("check_transaction_by_md5", {"md5": md5_value})

        if response.get("responseCode") == 0:
            status = response.get("data", {}).get("status")
            normalised = status.upper() if isinstance(status, str) else "PAID"
            return "PAID" if normalised in {"SUCCESS", "PAID"} else "UNPAID"

        # Bakong returns errorCode 11 when the transaction is not found (yet unpaid)
        if response.get("errorCode") in {11, 12}:
            return "UNPAID"

        # For any other response treat as unpaid, the caller will retry.
        return "UNPAID"

    def get_payment(self, md5: str):
        """Return full payment detail when a transaction is already paid."""
        md5_value = (md5 or "").strip()
        if not md5_value:
            raise ValueError("A valid MD5 hash is required to retrieve payment details.")

        response = self._post_bakong("check_transaction_by_md5", {"md5": md5_value})
        if response.get("responseCode") == 0:
            return response.get("data")
        return None

    def check_bulk_payments(self, md5_list):
        """Return the list of hashes that are marked as paid on Bakong."""
        if not isinstance(md5_list, (list, tuple)):
            raise ValueError("md5_list must be a list of md5 hashes.")

        hashes = [str(item).strip() for item in md5_list if str(item).strip()]
        if not hashes:
            return []

        if len(hashes) > 50:
            raise ValueError("Bakong API accepts at most 50 hashes per request.")

        response = self._post_bakong("check_transaction_by_md5_list", hashes)
        if response.get("responseCode") != 0:
            return []

        paid = []
        for item in response.get("data", []):
            status = item.get("status")
            md5_value = item.get("md5")
            if isinstance(status, str) and status.upper() in {"SUCCESS", "PAID"} and md5_value:
                paid.append(md5_value)
        return paid


# ------------------- LOAD ENV -------------------
# Note: moved environment loading into main() so importing the package
# doesn't execute demo runtime checks (avoids raising on import-time).
# ------------------------------------------------

# ------------------- CONFIG -------------------
POLL_INTERVAL_SEC = 3          # how often we check status
QR_VALIDITY_SEC = 120          # QR lifetime (seconds)
MERCHANT_NAME = "C4 TECH HUB"
BANK_ACCOUNT = "seakleng_touch@aclb"
CITY = "Phnom Penh"
AMOUNT = 0.01
CURRENCY = "USD"  # or "KHR"
STORE_LABEL = "C4 TECH HUB"


BILL_NUMBER = "C4TECHHUB-001"
TERMINAL_LABEL = "C4TECHHUB-1"
# optional phone number for additional_data_field (keep empty when not used)
PHONE_NUMBER = ""
# ------------------------------------------------


def format_amount_dot(value: float) -> str:
    """
    Return string like '0.01' with DOT as decimal separator.
    No commas.
    """
    cents = int(
        Decimal(str(value)).scaleb(2).to_integral_value(rounding=ROUND_DOWN)
    )
    whole = cents // 100
    frac = cents % 100
    return f"{whole}.{frac:02d}"  # "0.01", "5.00", etc.


def log_transaction(md5_value: str):
    """
    Folder layout (PER REQUEST):

    MD5/
        27,Oct,2025 10-06Am/
            27,Oct,2025 10-06Am.csv

    Rules:
    - Top-level folder is literally named "MD5"
    - Each transaction gets its own timestamp folder
      named like "27,Oct,2025 10-06Am"
    - Inside that folder, we create a CSV file with the
      same name and .csv extension

    CSV headers:
        MD5, datetime

    Row:
        <md5_value>, <YYYY-MM-DD HH:MM:SS>
    """
    # 1. Make sure root folder "MD5" exists
    root_folder = "MD5"
    os.makedirs(root_folder, exist_ok=True)

    # 2. Build timestamp string like "27,Oct,2025 10-06Am"
    now = datetime.now()

    # date part, ex: "27,Oct,2025"
    date_part = now.strftime("%d,%b,%Y")

    # time part, start with something like "10:06AM"
    time_part_raw = now.strftime("%I:%M%p")

    # convert "AM"/"PM" -> "Am"/"Pm", keep hour+minute
    if time_part_raw.endswith("AM"):
        suffix = "Am"
        hm_part = time_part_raw[:-2]  # "10:06"
    elif time_part_raw.endswith("PM"):
        suffix = "Pm"
        hm_part = time_part_raw[:-2]  # "10:06"
    else:
        suffix = time_part_raw[-2:]
        hm_part = time_part_raw[:-2]

    # Windows can't handle ":" in folder/file names
    hm_part_safe = hm_part.replace(":", "-")  # "10-06"

    # final formatted time for folder/file
    time_part_final = f"{hm_part_safe}{suffix}"  # "10-06Am" / "10-06Pm"

    # final timestamp folder name
    timestamp_str = f"{date_part} {time_part_final}"  # "27,Oct,2025 10-06Am"

    # 3. Create timestamp folder under MD5/
    timestamp_folder = os.path.join(root_folder, timestamp_str)
    os.makedirs(timestamp_folder, exist_ok=True)

    # 4. CSV file path in that folder
    csv_path = os.path.join(timestamp_folder, f"{timestamp_str}.csv")

    # 5. Human-readable datetime for inside CSV row
    human_time = now.strftime("%Y-%m-%d %H:%M:%S")

    # 6. Write the CSV with header + single row
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["MD5", "datetime"])
        writer.writerow([md5_value, human_time])

    print(f"[OK] Logged transaction to {csv_path}")


def build_qr(kh: KHQR):
    """
    Generate QR payload string, md5 for polling, and PNG bytes from KHQR SDK.
    We do NOT save the QR image on disk.
    """
    qr = kh.create_qr(
        bank_account=BANK_ACCOUNT,
        merchant_name=MERCHANT_NAME,
        merchant_city=CITY,
        amount=float(Decimal(str(AMOUNT))),
        currency=CURRENCY,
        store_label=STORE_LABEL,
        phone_number=PHONE_NUMBER,
        bill_number=BILL_NUMBER,
        terminal_label=TERMINAL_LABEL,
        static=False,  # dynamic QR
    )

    md5 = kh.generate_md5(qr)
    png_bytes = kh.qr_image(qr, format="bytes")

    return qr, md5, png_bytes


def create_flat_card(width, height, radius=30, color="white"):
    """
    Rounded white card background for the main UI card.
    """
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(
        [(0, 0), (width, height)],
        radius=radius,
        fill=color
    )
    return img


def center_window(win, width, height):
    """
    Center a Tk window on screen.
    """
    sw = win.winfo_screenwidth()
    sh = win.winfo_screenheight()
    x = int((sw - width) / 2)
    y = int((sh - height) / 2)
    win.geometry(f"{width}x{height}+{x}+{y}")


def popup_status(root, title_text, body_text, bg_color, fg_color):
    """
    Custom popup window (for PAID / UNPAID final status).
    - No buttons
    - Plays sound
    - Auto close after 3 seconds
    """
    try:
        root.bell()
    except Exception:
        pass

    win = tk.Toplevel(root)
    win.title("Payment Status")
    win.configure(bg=bg_color)
    win.attributes("-topmost", True)
    win.resizable(False, False)

    # center popup over root
    w, h = 280, 140
    root_x = root.winfo_rootx()
    root_y = root.winfo_rooty()
    root_w = root.winfo_width()
    root_h = root.winfo_height()
    pop_x = root_x + (root_w - w) // 2
    pop_y = root_y + (root_h - h) // 2
    win.geometry(f"{w}x{h}+{pop_x}+{pop_y}")

    tk.Label(
        win,
        text=title_text,
        bg=bg_color,
        fg=fg_color,
        font=("Segoe UI", 16, "bold"),
        anchor="center",
    ).pack(pady=(20, 5))

    tk.Label(
        win,
        text=body_text,
        bg=bg_color,
        fg=fg_color,
        font=("Segoe UI", 11, "normal"),
        anchor="center",
        justify="center",
    ).pack(pady=(0, 10))

    # close popup after 3000ms
    win.after(3000, win.destroy)


def run_ui(kh: KHQR, md5: str, png_bytes: bytes, token_present: bool):
    """
    UI window:
    - KHQR header
    - Amount with dot
    - QR image
    - Countdown + polling
    - Popup result
    - Auto close
    """

    state = {
        "final_status": "UNPAID",
        "paid_flag": False,
        "expired_flag": False,
        "done_flag": False,
    }

    root = tk.Tk()
    root.title("KHQR Payment ")

    WIDTH, HEIGHT = 420, 700
    center_window(root, WIDTH, HEIGHT)
    root.resizable(False, False)
    root.configure(bg="#edf0f3")

    # layout card
    card_x, card_y, card_w, card_h = 40, 0, 340, 660
    card_center_x = card_x + card_w // 2

    # rounded white card
    card_img = create_flat_card(card_w, card_h, radius=30, color="white")
    card_photo = ImageTk.PhotoImage(card_img)
    tk.Label(root, image=card_photo, bg="#edf0f3").place(x=card_x, y=card_y)

    # KHQR title
    tk.Label(
        root,
        text="KHQR",
        bg="white",
        fg="#d81e05",
        font=("Segoe UI", 24, "bold"),
    ).place(x=card_center_x, y=25, anchor="n")

    # amount label
    amount_str = f"{format_amount_dot(AMOUNT)} {CURRENCY}"
    print("DEBUG amount_str ->", repr(amount_str))
    tk.Label(
        root,
        text=amount_str,
        bg="white",
        fg="#1a1a1a",
        font=("Segoe UI", 16, "bold"),
    ).place(x=card_center_x, y=68, anchor="n")

    # divider line
    tk.Frame(root, bg="#e0e0e0", width=290, height=1).place(x=60, y=100)

    # QR image (full KHQR card from API)
    qr_img = Image.open(io.BytesIO(png_bytes)).resize((300, 450))
    qr_photo = ImageTk.PhotoImage(qr_img)
    qr_label = tk.Label(
        root,
        image=qr_photo,
        bg="white",
        borderwidth=0,
        highlightthickness=0
    )
    qr_label.place(x=60, y=120)

    # merchant name
    tk.Label(
        root,
        text=MERCHANT_NAME,
        bg="white",
        fg="#222",
        font=("Segoe UI", 12, "bold"),
    ).place(x=card_center_x, y=580, anchor="n")

    # countdown timer
    timer_var = tk.StringVar(value="QR valid for 2:00")
    tk.Label(
        root,
        textvariable=timer_var,
        bg="#edf0f3",
        fg="#333",
        font=("Segoe UI", 10, "bold"),
    ).place(x=card_center_x, y=610, anchor="n")

    # status label
    status_var = tk.StringVar(value="Waiting for payment…")
    tk.Label(
        root,
        textvariable=status_var,
        bg="#edf0f3",
        fg="#000",
        font=("Segoe UI", 11, "bold"),
    ).place(x=card_center_x, y=640, anchor="n")

    start_time = time.time()

    def finish_and_close():
        if state["done_flag"]:
            return
        state["done_flag"] = True
        root.after(1500, root.destroy)

    def mark_paid_and_close():
        if state["paid_flag"]:
            return
        state["paid_flag"] = True
        state["final_status"] = "PAID"

        status_var.set("PAID ✅")
        timer_var.set("QR valid for 0:00")

        popup_status(
            root,
            title_text="PAID ✅",
            body_text="Payment received.",
            bg_color="#d1f7d6",
            fg_color="#0a4f0a",
        )

        finish_and_close()

    def mark_expired_and_close():
        if state["expired_flag"]:
            return
        state["expired_flag"] = True

        if not state["paid_flag"]:
            state["final_status"] = "UNPAID"
            status_var.set("EXPIRED ❌ UNPAID")
            timer_var.set("QR expired")

            popup_status(
                root,
                title_text="UNPAID ❌",
                body_text="QR expired. No payment.",
                bg_color="#ffe2e2",
                fg_color="#7a0000",
            )

        finish_and_close()

    def countdown():
        remaining = QR_VALIDITY_SEC - int(time.time() - start_time)
        if remaining > 0 and not state["paid_flag"]:
            m, s = divmod(remaining, 60)
            timer_var.set(f"QR valid for {m}:{s:02d}")
            root.after(1000, countdown)
        else:
            if not state["paid_flag"]:
                timer_var.set("QR expired")
                mark_expired_and_close()
            else:
                timer_var.set("QR valid for 0:00")

    def poll_payment():
        while True:
            elapsed = time.time() - start_time
            if elapsed >= QR_VALIDITY_SEC:
                break
            if state["paid_flag"] or state["expired_flag"]:
                break

            try:
                status = kh.check_payment(md5)
            except Exception:
                time.sleep(POLL_INTERVAL_SEC)
                continue

            if status == "PAID":
                root.after(0, mark_paid_and_close)
                break

            root.after(0, lambda: status_var.set("Waiting for payment…"))
            time.sleep(POLL_INTERVAL_SEC)

    countdown()
    if token_present:
        threading.Thread(target=poll_payment, daemon=True).start()

    root.mainloop()
    return state["final_status"]


def main():
    # Load environment at runtime (only when running script). This avoids
    # import-time side-effects while preserving the original demo behavior.
    load_dotenv()
    BAKONG_TOKEN = os.getenv("BAKONG_TOKEN")
    if not BAKONG_TOKEN:
        print("❗ BAKONG_TOKEN not found in .env file; continuing without token (demo mode).")

    kh = KHQR(bakong_token=BAKONG_TOKEN)

    qr, md5, png_bytes = build_qr(kh)

    print("[OK] QR payload built. length:", len(qr))
    print("[OK] MD5:", md5)

    # write log for this transaction using the folder layout you asked
    log_transaction(md5)

    final_status = run_ui(kh, md5, png_bytes, token_present=bool(BAKONG_TOKEN))

    if final_status == "PAID":
        print("RESULT: PAID ✅")
    else:
        print("RESULT: UNPAID ❌ (Expired or not scanned)")


if __name__ == "__main__":
    main()
