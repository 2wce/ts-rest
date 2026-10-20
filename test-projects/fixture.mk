# Test fixture source and locks in isolation. Tarball checksums change with builds;
# refresh them only in the temporary copy, retaining locked external versions.
ifeq ($(FIXTURE_RUNTIME),pnpm)
fixture_install = pnpm install --no-frozen-lockfile
fixture_test = pnpm test && pnpm build
else
# Bun install keeps stale local archive integrities, even with --force. Update
# only declared ts-rest packages; external packages retain their locked versions.
fixture_install = bun update --no-save $$(bun -e 'const p = await Bun.file("package.json").json(); console.log(Object.keys({...p.dependencies, ...p.devDependencies}).filter(name => name.startsWith("@ts-rest/")).join(" "))')
fixture_test = bun test && bun build index.ts --target bun --outdir ./dist && bun tsc
endif

.PHONY: e2e
e2e:
	@set -eu; \
	test -f ../../dist/packages/ts-rest-core.tgz; \
	mkdir -p ../../tmp; \
	fixture_dir=$$(mktemp -d ../../tmp/ts-rest-fixture-XXXXXX); \
	trap 'rm -rf "$$fixture_dir"' EXIT; \
	tar --exclude=node_modules --exclude=dist --exclude=.vite -cf - . | tar -xf - -C "$$fixture_dir"; \
	cd "$$fixture_dir"; \
	$(fixture_install); \
	for library in node_modules/@ts-rest/*; do \
		name=$${library##*/}; \
		archive="../../dist/packages/ts-rest-$$name.tgz"; \
		test -f "$$archive"; \
		tar -tzf "$$archive" | while IFS= read -r file; do \
			tar -xOf "$$archive" "$$file" | cmp - "$$library/$${file#package/}"; \
		done; \
	done; \
	$(fixture_test)
