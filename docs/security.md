# Security

Endpoint URLs are HTTPS-only by default. Local development may explicitly enable HTTP. Endpoint validation and send-time checks must reject loopback, private, link-local, metadata, and unsafe IPv6 destinations. Outbound requests use HMAC signatures.
