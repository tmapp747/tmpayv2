// Hypothetical original code representing a deposit form
function DepositForm() {
  return (
    <div className="bg-blue-600 rounded-lg p-4">
      {/* Form content here */}
      <form>
          {/*Input fields and submit button etc.*/}
      </form>
    </div>
  );
}


//Modified code after applying the change
function DepositForm() {
  return (
    <div className="bg-card rounded-lg p-6 shadow-md border border-border">
      {/* Form content here */}
      <form>
          {/*Input fields and submit button etc.*/}
      </form>
    </div>
  );
}

export default DepositForm;