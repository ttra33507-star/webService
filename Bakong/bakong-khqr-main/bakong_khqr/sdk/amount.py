# amount.py
from decimal import Decimal, ROUND_DOWN
from .emv import EMV

emv = EMV()

class Amount:
    """
    Build the EMV TLV for Transaction Amount (Tag 54 in EMVCo/KHQR).
    - The Length is the character count of the VALUE only.
    - The Value is a plain decimal string with a dot as separator.
    - No leading zero padding, no thousands separators.
    - We keep exactly two decimals (rounded down).
    """

    def __init__(self):
        self.__transaction_amount = emv.transaction_amount
        # Max number of characters allowed in the VALUE string (not tag+len).
        # In KHQR this is typically 13, but we use whatever EMV config provides.
        self.__max_length = emv.invalid_length_amount

    def value(self, amount) -> str:
        """
        Return TLV string for the amount.
        Example: tag='54', amount='0.01' -> '540400.01'
        """
        # Validate & normalize using Decimal to avoid float artifacts
        try:
            dec = Decimal(str(amount))
        except Exception:
            raise ValueError("Amount must be numeric (int/float/Decimal/str).")

        # Force exactly 2 decimals, rounded down (safer for money display)
        dec = dec.quantize(Decimal("0.01"), rounding=ROUND_DOWN)

        # Make sure we always use a dot as the decimal separator
        amount_str = format(dec, "f")  # e.g., '0.01', '29.99', '100.00'

        # Enforce max length constraint on the VALUE part only
        if len(amount_str) > self.__max_length:
            raise ValueError(
                f"Amount value too long (len={len(amount_str)}). "
                f"Max allowed is {self.__max_length} characters."
            )

        # Length is the length of VALUE only, 2-digit zero-padded
        length = f"{len(amount_str):02d}"

        # Return Tag + Length + Value
        return f"{self.__transaction_amount}{length}{amount_str}"
