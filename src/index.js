addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	if (request.method !== 'POST') {
		return new Response('Send a POST request', { status: 405 });
	}

	const productData = await request.json();

	const odooUrl = 'https://erp.congzhoumachinery.com';
	const username = 'sagar@congzhoumachinery.com';
	const password = '2892475c2456561100a14bc76b8480f4725498e8';
	const dbName = 'erp.congzhoumachinery.com';

	// XML-RPC payload for authentication
	const authPayload = `
    <methodCall>
      <methodName>authenticate</methodName>
      <params>
        <param><value><string>${dbName}</string></value></param>
        <param><value><string>${username}</string></value></param>
        <param><value><string>${password}</string></value></param>
        <param><value><struct></struct></value></param>
      </params>
    </methodCall>
  `;

	const authResponse = await fetch(`${odooUrl}/xmlrpc/2/common`, {
		method: 'POST',
		headers: {
			'Content-Type': 'text/xml',
		},
		body: authPayload,
	});

	const authText = await authResponse.text();
	console.log(authText); // Debugging line to check the response

	const uidMatch = authText.match(/<int>(\d+)<\/int>/);
	if (!uidMatch) {
		return new Response(JSON.stringify({ success: false, message: 'Authentication failed' }), { status: 401 });
	}

	const uid = uidMatch[1];

	// XML-RPC payload to create product
	const createProductPayload = `
    <methodCall>
      <methodName>execute_kw</methodName>
      <params>
        <param><value><string>${dbName}</string></value></param>
        <param><value><int>${uid}</int></value></param>
        <param><value><string>${password}</string></value></param>
        <param><value><string>product.template</string></value></param>
        <param><value><string>create</string></value></param>
        <param>
          <value>
            <array>
              <data>
                <value>
                  <struct>
                    <member><name>name</name><value><string>${productData.product_name}</string></value></member>
                    <member><name>default_code</name><value><string>${productData.internal_reference}</string></value></member>
                    <member><name>type</name><value><string>${productData.product_type}</string></value></member>
                    <member><name>categ_id</name><value><string>${productData.product_category}</string></value></member>
                    <member><name>list_price</name><value><double>${parseFloat(productData.sales_price)}</double></value></member>
                    <member><name>standard_price</name><value><double>${parseFloat(productData.cost)}</double></value></member>
                    <member><name>barcode</name><value><string>${productData.barcode}</string></value></member>
                    <member><name>company_id</name><value><string>${productData.company}</string></value></member>
                    <member><name>sale_ok</name><value><boolean>${productData.sales === 'Yes'}</boolean></value></member>
                    <member><name>invoice_policy</name><value><string>${productData.invoicing_policy}</string></value></member>
                    <member><name>description_sale</name><value><string>${productData.sales_description}</string></value></member>
                    <member><name>purchase_ok</name><value><boolean>${productData.purchases === 'Yes'}</boolean></value></member>
                    <member><name>description_purchase</name><value><string>${productData.purchase_description}</string></value></member>
                    <member><name>seller_ids</name><value><string>${productData.vendor}</string></value></member>
                    <member><name>route_ids</name><value><string>${productData.route}</string></value></member>
                    <member><name>weight</name><value><double>${parseFloat(productData.weight)}</double></value></member>
                    <member><name>volume</name><value><double>${parseFloat(productData.volume)}</double></value></member>
                    <member><name>taxes_id</name><value><string>${productData.sales_gst}</string></value></member>
                    <member><name>supplier_taxes_id</name><value><string>${productData.purchase_gst}</string></value></member>
                  </struct>
                </value>
              </data>
            </array>
          </value>
        </param>
      </params>
    </methodCall>
  `;

	const createProductResponse = await fetch(`${odooUrl}/xmlrpc/2/object`, {
		method: 'POST',
		headers: {
			'Content-Type': 'text/xml',
		},
		body: createProductPayload,
	});

	const createProductText = await createProductResponse.text();
	console.log(createProductText); // Debugging line to check the response

	const productIdMatch = createProductText.match(/<int>(\d+)<\/int>/);
	if (!productIdMatch) {
		return new Response(JSON.stringify({ success: false, message: 'Failed to create product' }), { status: 500 });
	}

	return new Response(JSON.stringify({ success: true, message: 'Product created successfully', product_id: productIdMatch[1] }), {
		status: 200,
	});
}
